import { createClient } from 'jsr:@supabase/supabase-js@2'

type SupabaseClient = ReturnType<typeof createClient>

export async function getAttributeValueId(
  supabase: SupabaseClient,
  attributeId: string,
  crmValue: string,
): Promise<number | null> {
  if (!crmValue) return null
  const { data } = await supabase
    .from('ml_attribute_cache')
    .select('ml_value_id')
    .eq('attribute_id', attributeId)
    .or(`crm_value.ilike.${crmValue},ml_value_name.ilike.${crmValue}`)
    .limit(1)
    .maybeSingle()
  return data?.ml_value_id ?? null
}

export async function getCityId(supabase: SupabaseClient, cityName = 'Uberaba'): Promise<string | null> {
  const { data } = await supabase
    .from('ml_cities_cache')
    .select('ml_city_id')
    .ilike('name', cityName)
    .limit(1)
    .maybeSingle()
  return data?.ml_city_id ?? null
}

export async function populateAttributeCache(
  supabase: SupabaseClient,
  token: string,
): Promise<{ brands: number; models: number; error: string | null }> {
  try {
    const catRes = await fetch('https://api.mercadolibre.com/categories/MLB1744/attributes', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!catRes.ok) return { brands: 0, models: 0, error: 'Failed to fetch category attributes' }
    const attrs = await catRes.json()
    const brandAttr = attrs.find((a: any) => a.id === 'BRAND')
    const modelAttr = attrs.find((a: any) => a.id === 'MODEL')
    let brandsInserted = 0
    let modelsInserted = 0

    if (brandAttr?.values) {
      for (const v of brandAttr.values) {
        const { error } = await supabase
          .from('ml_attribute_cache')
          .upsert({
            attribute_id: 'BRAND',
            ml_value_id: v.id,
            ml_value_name: v.name,
            crm_value: v.name,
          }, { onConflict: 'attribute_id,ml_value_id' })
        if (!error) brandsInserted++
      }
    }

    const { data: vehicles } = await supabase
      .from('veiculos')
      .select('marca, modelo')
      .eq('status', 'disponivel')

    if (vehicles && modelAttr) {
      const modelSet = new Set<string>()
      for (const v of vehicles) {
        if (v.modelo) modelSet.add(v.modelo)
      }
      for (const modelName of modelSet) {
        const searchRes = await fetch(
          `https://api.mercadolibre.com/categories/MLB1744/attributes/MODEL?search=${encodeURIComponent(modelName)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        if (searchRes.ok) {
          const searchData = await searchRes.json()
          if (searchData.values && searchData.values.length > 0) {
            const match = searchData.values[0]
            await supabase
              .from('ml_attribute_cache')
              .upsert({
                attribute_id: 'MODEL',
                ml_value_id: match.id,
                ml_value_name: match.name,
                crm_value: modelName,
              }, { onConflict: 'attribute_id,ml_value_id' })
            modelsInserted++
          }
        }
      }
    }

    return { brands: brandsInserted, models: modelsInserted, error: null }
  } catch (err: any) {
    return { brands: 0, models: 0, error: err.message }
  }
}

export async function populateCityCache(
  supabase: SupabaseClient,
  token: string,
): Promise<{ error: string | null }> {
  try {
    const res = await fetch('https://api.mercadolibre.com/classified_locations/states/BR-MG', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return { error: 'Failed to fetch MG state cities' }
    const data = await res.json()
    if (data.cities) {
      for (const city of data.cities) {
        await supabase
          .from('ml_cities_cache')
          .upsert({
            ml_city_id: city.id,
            name: city.name,
            state_id: 'BR-MG',
          }, { onConflict: 'ml_city_id' })
      }
    }
    return { error: null }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function checkAvailableListingTypes(
  token: string,
  categoryId: string,
  currentListingType: string,
): Promise<{ valid: boolean; error: string | null }> {
  try {
    const res = await fetch(
      `https://api.mercadolibre.com/users/me/available_listing_types?category_id=${categoryId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) return { valid: true, error: null }
    const data = await res.json()
    if (!Array.isArray(data)) return { valid: true, error: null }
    const tierOrder = ['bronze', 'silver', 'gold_special', 'gold_pro', 'gold_premium']
    const currentIdx = tierOrder.indexOf(currentListingType)
    for (const lt of data) {
      const ltIdx = tierOrder.indexOf(lt.id)
      if (ltIdx >= 0 && ltIdx < currentIdx) {
        return { valid: false, error: `Listing type ${currentListingType} would be downgraded to ${lt.id}` }
      }
    }
    return { valid: true, error: null }
  } catch {
    return { valid: true, error: null }
  }
}
