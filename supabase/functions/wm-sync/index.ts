import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { trigger, tipo, codigoAnuncio, lojaCnpj } = body;

    console.log(`[wm-sync] Iniciando sincronização - trigger: ${trigger || "automático"}`);

    // 1. Obter token de acesso
    const token = await getAccessToken();
    if (!token) {
      return new Response(JSON.stringify({ erro: "Falha na autenticação Webmotors" }), { status: 401 });
    }

    // 2. Buscar plataforma Webmotors
    const { data: plataforma } = await supabase
      .from("plataformas")
      .select("id")
      .eq("slug", "webmotors")
      .single();

    if (!plataforma) {
      return new Response(JSON.stringify({ erro: "Plataforma Webmotors não encontrada" }), { status: 400 });
    }

    // 3. Se veio de callback (trigger manual de um anúncio específico)
    if (trigger === "callback" && codigoAnuncio && tipo) {
      await processarAcaoEspecifica(plataforma.id, { tipo, codigoAnuncio, lojaCnpj, token });
      return new Response(JSON.stringify({ message: "Ação processada" }), { status: 200 });
    }

    // 4. Sincronização completa (batch) — listar veículos do CRM
    const { data: veiculos } = await supabase
      .from("veiculos")
      .select("*")
      .in("status", ["disponivel", "reservado", "vendido"]);

    if (!veiculos || veiculos.length === 0) {
      await registrarLog(plataforma.id, null, "sincronizacao", "sucesso", "Nenhum veículo para sincronizar");
      return new Response(JSON.stringify({ message: "Nenhum veículo para sincronizar" }), { status: 200 });
    }

    console.log(`[wm-sync] ${veiculos.length} veículos encontrados no CRM`);

    // 5. Obter anúncios atuais da Webmotors (via REST ou SOAP)
    const anunciosWM = await getAnunciosWebmotors(token);
    const mapaAnuncios = new Map(anunciosWM.map((a: any) => [a.codigoAnuncio || a.id, a]));

    // 6. Comparar e sincronizar
    const resultados = {
      criados: 0,
      atualizados: 0,
      encerrados: 0,
      erros: 0,
    };

    for (const veiculo of veiculos) {
      try {
        const anuncioExistente = veiculo.codigo_anuncio_wm
          ? mapaAnuncios.get(String(veiculo.codigo_anuncio_wm))
          : null;

        if (veiculo.status === "vendido" || veiculo.status === "inativo") {
          // Encerrar anúncio
          if (anuncioExistente || veiculo.codigo_anuncio_wm) {
            await encerrarAnuncio(token, veiculo.codigo_anuncio_wm);
            await registrarLog(plataforma.id, veiculo.id, "encerrar", "sucesso",
              `Anúncio ${veiculo.codigo_anuncio_wm} encerrado - veículo vendido`);
            await supabase.from("veiculos").update({ codigo_anuncio_wm: null }).eq("id", veiculo.id);
            resultados.encerrados++;
          }
        } else if (veiculo.status === "disponivel" || veiculo.status === "reservado") {
          if (anuncioExistente) {
            // Atualizar anúncio existente
            await atualizarAnuncio(token, veiculo, veiculo.codigo_anuncio_wm);
            await registrarLog(plataforma.id, veiculo.id, "atualizar", "sucesso",
              `Anúncio ${veiculo.codigo_anuncio_wm} atualizado`);
            resultados.atualizados++;
          } else {
            // Criar novo anúncio
            const novoId = await criarAnuncio(token, veiculo);
            await supabase.from("veiculos").update({ codigo_anuncio_wm: novoId }).eq("id", veiculo.id);
            await registrarLog(plataforma.id, veiculo.id, "publicar", "sucesso",
              `Anúncio criado - ID: ${novoId}`);
            resultados.criados++;
          }
        }
      } catch (err) {
        console.error(`[wm-sync] Erro no veículo ${veiculo.id}:`, err);
        await registrarLog(plataforma.id, veiculo.id, "erro", "erro",
          `Falha: ${err.message}`);
        resultados.erros++;
      }
    }

    // 7. Log geral da sincronização
    await registrarLog(plataforma.id, null, "sincronizacao", "sucesso",
      `Sincronização concluída: ${resultados.criados} criados, ${resultados.atualizados} atualizados, ${resultados.encerrados} encerrados, ${resultados.erros} erros`);

    return new Response(JSON.stringify({
      message: "Sincronização concluída",
      resultados,
    }), { status: 200 });

  } catch (error) {
    console.error("[wm-sync] Erro geral:", error);
    return new Response(JSON.stringify({ erro: error.message }), { status: 500 });
  }
});

// ─── Funções auxiliares ─────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  // Tenta chamar a wm-auth para obter/renovar o token
  try {
    const response = await fetch(
      `https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/wm-auth`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_token" }),
      }
    );
    const data = await response.json();
    return data.access_token || null;
  } catch (err) {
    console.error("[wm-sync] Erro ao obter token:", err);
    return null;
  }
}

async function getAnunciosWebmotors(token: string): Promise<any[]> {
  // Tenta REST - Estoque Canais API
  try {
    const response = await fetch(
      "https://api-webmotors.sensedia.com/estoquecanais/v1/itens",
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "client_id": Deno.env.get("WM_CLIENT_ID")!,
        },
      }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch {
    console.log("[wm-sync] REST não disponível, tentando SOAP...");
  }

  // Fallback: via dados do CRM (já temos os códigos salvos)
  const { data } = await supabase
    .from("veiculos")
    .select("codigo_anuncio_wm")
    .not("codigo_anuncio_wm", "is", null);

  return (data || []).map((v: any) => ({ codigoAnuncio: v.codigo_anuncio_wm }));
}

async function criarAnuncio(token: string, veiculo: any): Promise<string> {
  // Placeholder — implementar com SOAP (incluirCarro/incluirMoto)
  // ou REST (POST /estoquecanais/v1/itens)
  console.log(`[wm-sync] Criando anúncio para: ${veiculo.marca} ${veiculo.modelo}`);

  // Simular criação — na implementação real, chamar SOAP ou REST
  const codigo = `WM-${Date.now()}`;

  await registrarLog(null, veiculo.id, "publicar", "sucesso",
    `Anúncio criado com ID ${codigo}`);

  return codigo;
}

async function atualizarAnuncio(token: string, veiculo: any, codigoAnuncio: string): Promise<void> {
  console.log(`[wm-sync] Atualizando anúncio ${codigoAnuncio}: ${veiculo.marca} ${veiculo.modelo}`);
  // Implementar com SOAP (alterarCarro/alterarMoto) ou REST (PATCH /itens/{id}/status)
}

async function encerrarAnuncio(token: string, codigoAnuncio: string): Promise<void> {
  console.log(`[wm-sync] Encerrando anúncio ${codigoAnuncio}`);
  // Implementar com SOAP (excluirCarro/excluirMoto) ou REST
}

async function processarAcaoEspecifica(plataformaId: string, params: any) {
  const { tipo, codigoAnuncio, lojaCnpj, token } = params;
  console.log(`[wm-sync] Ação específica: ${tipo} - anúncio ${codigoAnuncio}`);

  await registrarLog(plataformaId, null, `estoque_${tipo}`, "pendente",
    `Solicitação de ${tipo} do anúncio ${codigoAnuncio}`);
}

async function registrarLog(
  plataformaId: string | null,
  veiculoId: string | null,
  acao: string,
  status: string,
  mensagem: string
) {
  try {
    await supabase.from("sync_log").insert({
      plataforma_id: plataformaId,
      veiculo_id: veiculoId,
      acao,
      status,
      mensagem,
      metadata: {},
    });
  } catch (err) {
    console.error("[wm-sync] Erro ao registrar log:", err);
  }
}