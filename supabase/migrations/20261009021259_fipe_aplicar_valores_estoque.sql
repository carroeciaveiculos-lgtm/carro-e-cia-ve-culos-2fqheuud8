-- ATENCAO: esta versao FALHA ao rodar (o Supabase nega set_config de session_replication_role dentro de funcao).
-- Foi substituida em seguida por 20261009022149_fipe_aplicar_valores_estoque_sem_replica.sql. Mantida so por historico.
-- FIPE do estoque, Fase 2 (09/10/2026): copia o valor FIPE do mes mais recente para veiculos.valor_fipe / fipe_ref.
-- Decisao da Adriana (09/10/2026): so no nosso cadastro; NAO reenvia as plataformas (os gatilhos de ML, NaPista e
-- Webmotors nao reagem a valor_fipe/fipe_ref -- conferido). Valor digitado a mao e sobrescrito no mes seguinte.
-- A funcao roda com session_replication_role=replica (so dentro da transacao) para o gatilho
-- registrar_alteracao_veiculo NAO trocar alterado_por/alterado_em ("Ultima alteracao" do cadastro).
-- Devolve, em jsonb, cada veiculo alterado com o valor antigo (backup para desfazer).

CREATE OR REPLACE FUNCTION public.fipe_aplicar_valores_estoque(
  p_referencia text,
  p_veiculo_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_resultado jsonb;
BEGIN
  -- Nunca aplica um mes que nao seja o mais recente ja gravado (evita regredir valores).
  IF p_referencia !~ '^[0-9]{1,5}$'
     OR p_referencia::int IS DISTINCT FROM (SELECT max(referencia_codigo::int) FROM public.fipe_valores_veiculo) THEN
    RETURN '[]'::jsonb;
  END IF;

  PERFORM set_config('session_replication_role', 'replica', true);

  WITH alvo AS (
    SELECT v.id, v.placa, v.valor_fipe AS antigo, v.fipe_ref AS fipe_ref_antigo,
           f.valor AS novo, f.referencia_mes
    FROM public.veiculos v
    JOIN public.fipe_valores_veiculo f
      ON f.veiculo_id = v.id
     AND f.referencia_codigo = p_referencia
     AND f.situacao = 'ok'
     AND f.valor > 0
    WHERE v.status = 'disponivel'
      AND (p_veiculo_id IS NULL OR v.id = p_veiculo_id)
      AND (v.valor_fipe IS DISTINCT FROM f.valor OR v.fipe_ref IS DISTINCT FROM f.referencia_mes)
    FOR UPDATE OF v
  ),
  atualizado AS (
    UPDATE public.veiculos v
    SET valor_fipe = a.novo, fipe_ref = a.referencia_mes
    FROM alvo a
    WHERE v.id = a.id
    RETURNING v.id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'veiculo_id', a.id,
           'placa', a.placa,
           'valor_fipe_antigo', a.antigo,
           'fipe_ref_antigo', a.fipe_ref_antigo,
           'valor_fipe_novo', a.novo,
           'fipe_ref_novo', a.referencia_mes)), '[]'::jsonb)
    INTO v_resultado
  FROM alvo a
  JOIN atualizado u ON u.id = a.id;

  RETURN v_resultado;
END;
$$;

REVOKE ALL ON FUNCTION public.fipe_aplicar_valores_estoque(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fipe_aplicar_valores_estoque(text, uuid) TO service_role;
