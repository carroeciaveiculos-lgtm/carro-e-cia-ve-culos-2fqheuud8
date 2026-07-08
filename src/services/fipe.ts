import { supabase } from '@/lib/supabase/client'

export const getMarcas = async () => {
  const res = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas')
  return res.json()
}

export const getModelos = async (marcaId: string) => {
  const res = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos`)
  const data = await res.json()
  return data.modelos
}

export const getAnos = async (marcaId: string, modeloId: string) => {
  const res = await fetch(
    `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos/${modeloId}/anos`,
  )
  return res.json()
}

export const getFipeHistoryFromDB = async (codigoFipe: string) => {
  const { data, error } = await supabase
    .from('fipe_anos')
    .select('mes_referencia, valor_fipe')
    .eq('codigo_fipe', codigoFipe)
    .order('mes_referencia', { ascending: true })
    .limit(24)
  return { data, error }
}
