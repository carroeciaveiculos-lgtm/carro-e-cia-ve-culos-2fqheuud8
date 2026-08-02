import { constantTimeEqual } from './hmac-validator.ts'

export function isInternalRequestAuthorized(req: Request): boolean {
  const provided = req.headers.get('x-internal-secret')
  const expected = Deno.env.get('INTERNAL_SERVICE_SECRET')
  if (!provided || !expected) return false
  return constantTimeEqual(provided, expected)
}

export function unauthorizedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
