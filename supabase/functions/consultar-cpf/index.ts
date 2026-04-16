import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
};

function findNome(obj: any): string {
  if (!obj || typeof obj !== 'object') return '';
  for (const key of Object.keys(obj)) {
    const k = key.toLowerCase();
    if (k === 'nome' || k === 'nomerazaosocial' || k === 'razaosocial' || k === 'nome_razao_social') {
      if (typeof obj[key] === 'string' && obj[key].trim() !== '') {
        return obj[key];
      }
    }
  }
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object') {
      const res = findNome(obj[key]);
      if (res) return res;
    }
  }
  return '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cpf } = await req.json();

    if (!cpf) {
      throw new Error('CPF não informado');
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    const token = Deno.env.get('API_BRASIL_TOKEN');

    if (!token) {
      // Mock dinâmico para ambiente sem token
      const nomes = ['João da Silva', 'Maria Oliveira', 'Pedro Santos', 'Ana Costa', 'Carlos Pereira', 'Luiz Fernando Rodrigues de Araújo', 'Roberto Carlos da Costa'];
      const hash = cleanCpf.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const nome = nomes[hash % nomes.length];
      
      await new Promise(resolve => setTimeout(resolve, 600));

      return new Response(JSON.stringify({ 
        success: true, 
        data: { 
          nome: nome,
          cpf: cleanCpf,
          mock: true
        } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://gateway.apibrasil.io/api/v2/consulta/cpf/credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cpf: cleanCpf,
        tipo: 'dados-cadastrais',
        homolog: false
      })
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`Falha de comunicação com a API Brasil (Status: ${res.status}).`);
    }

    if (!res.ok || data?.error) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Token da API Brasil inválido ou expirado.');
      }
      throw new Error(data?.message || data?.error || `Erro desconhecido na API Brasil (Status: ${res.status})`);
    }

    const nomeEncontrado = findNome(data);

    const result = {
      cpf: cleanCpf,
      nome: nomeEncontrado || '',
    };

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
