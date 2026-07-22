export interface MLTokenResult {
  token: string | null;
  error: string | null;
}

export async function getValidMLToken(
  supabase: any,
): Promise<MLTokenResult> {
  const { data: creds, error: fetchError } = await supabase
    .from('ml_credentials')
    .select('access_token, refresh_token, expires_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !creds) {
    return { token: null, error: 'No Mercado Livre credentials found' };
  }

  const now = new Date();
  const expiresAt = new Date(creds.expires_at);
  const bufferMs = 5 * 60 * 1000;

  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    return { token: creds.access_token, error: null };
  }

  if (!creds.refresh_token) {
    return { token: null, error: 'Refresh token missing — re-authentication required' };
  }

  const clientId = Deno.env.get('ML_CLIENT_ID')!;
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET')!;

  const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: creds.refresh_token,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    return { token: null, error: `Token refresh failed: ${errText}` };
  }

  const tokenData = await tokenRes.json();
  const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  await supabase.from('ml_credentials').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  await supabase.from('ml_credentials').insert({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  });

  return { token: tokenData.access_token, error: null };
}
