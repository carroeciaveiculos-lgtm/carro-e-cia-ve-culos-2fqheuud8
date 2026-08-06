$SUPABASE_URL = "https://htpcqdbhktmvppfemnad.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cGNxZGJoa3RtdnBwZmVtbmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzA0MzMsImV4cCI6MjA5MTUwNjQzM30.6Yu_iOYb7gs2wXrBc60fHCt3Nud1-PRK17SamqzJj2k"

$email = Read-Host "E-mail do painel admin"
$senha = Read-Host "Senha" -AsSecureString
$senhaTexto = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha))

$loginBody = @{ email = $email; password = $senhaTexto } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/token?grant_type=password" `
    -Method Post -Headers @{ "apikey" = $ANON_KEY; "Content-Type" = "application/json" } `
    -Body $loginBody
$TOKEN = $loginResp.access_token
if (-not $TOKEN) { Write-Host "Falha no login." -ForegroundColor Red; exit }
Write-Host "Login OK." -ForegroundColor Green

$buckets = @("media", "logos-e-imagens", "veiculos-fotos", "documentos-veiculos")
foreach ($bucket in $buckets) {
    Write-Host "`n=== Limpando bucket: $bucket ===" -ForegroundColor Cyan
    $body = @{ action = "cleanup"; bucket = $bucket } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/migrar-storage-r2" `
        -Method Post -Headers @{ "Authorization" = "Bearer $TOKEN"; "apikey" = $ANON_KEY; "Content-Type" = "application/json" } `
        -Body $body
    Write-Host "  Apagados: $($resp.deleted) arquivos" -ForegroundColor Green
}

Write-Host "`n=========================================" -ForegroundColor Yellow
Write-Host "LIMPEZA CONCLUÍDA. Confira o painel de billing" -ForegroundColor Yellow
Write-Host "do Supabase em alguns minutos pra ver a quota liberada." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
