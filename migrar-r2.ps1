# migrar-r2.ps1 — Migração de arquivos do Supabase Storage para o Cloudflare R2

$SUPABASE_URL = "https://htpcqdbhktmvppfemnad.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cGNxZGJoa3RtdnBwZmVtbmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzA0MzMsImV4cCI6MjA5MTUwNjQzM30.6Yu_iOYb7gs2wXrBc60fHCt3Nud1-PRK17SamqzJj2k"

# --- PASSO 1: login (pede seu e-mail e senha do painel admin) ---
$email = Read-Host "E-mail do painel admin"
$senha = Read-Host "Senha" -AsSecureString
$senhaTexto = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha))

$loginBody = @{ email = $email; password = $senhaTexto } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/token?grant_type=password" `
    -Method Post -Headers @{ "apikey" = $ANON_KEY; "Content-Type" = "application/json" } `
    -Body $loginBody

$TOKEN = $loginResp.access_token
if (-not $TOKEN) { Write-Host "Falha no login. Confira e-mail/senha." -ForegroundColor Red; exit }
Write-Host "Login OK." -ForegroundColor Green

# --- PASSO 2: função auxiliar pra migrar um bucket, em lotes pequenos ---
# Lotes de 8 arquivos por chamada (o servidor só aceita 8 por vez, ou dá erro).
# Se der erro mesmo assim, espera e tenta de novo, até 5 vezes seguidas.
function Invoke-BucketMigration($bucket) {
    Write-Host "`n=== Migrando bucket: $bucket ===" -ForegroundColor Cyan
    $totalProcessado = 0
    $falhasSeguidas = 0
    do {
        $body = @{ action = "migrate"; bucket = $bucket } | ConvertTo-Json
        try {
            $resp = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/migrar-storage-r2" `
                -Method Post -Headers @{ "Authorization" = "Bearer $TOKEN"; "apikey" = $ANON_KEY; "Content-Type" = "application/json" } `
                -Body $body
            $qtd = $resp.processed
            $totalProcessado += $qtd
            $falhasSeguidas = 0
            Write-Host "  Lote processado: $qtd arquivos (total até agora: $totalProcessado)"
            Start-Sleep -Milliseconds 800
        }
        catch {
            $falhasSeguidas++
            Write-Host "  Falha temporária (tentativa $falhasSeguidas). Aguardando 10s..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            $qtd = 1
            if ($falhasSeguidas -ge 5) {
                Write-Host "  5 falhas seguidas. Pulando esse bucket por agora." -ForegroundColor Red
                $qtd = 0
            }
        }
    } while ($qtd -gt 0)
    Write-Host "Bucket '$bucket' concluído. Total migrado: $totalProcessado" -ForegroundColor Green
}

# --- PASSO 3: migra os 4 buckets, do maior pro menor ---
Invoke-BucketMigration "media"
Invoke-BucketMigration "logos-e-imagens"
Invoke-BucketMigration "veiculos-fotos"
Invoke-BucketMigration "documentos-veiculos"

# --- PASSO 4: atualiza as URLs dos veículos no banco pra apontar pro R2 ---
Write-Host "`n=== Atualizando URLs dos veículos ===" -ForegroundColor Cyan
$updateResp = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/migrar-storage-r2" `
    -Method Post -Headers @{ "Authorization" = "Bearer $TOKEN"; "apikey" = $ANON_KEY; "Content-Type" = "application/json" } `
    -Body (@{ action = "update_urls" } | ConvertTo-Json)
Write-Host "URLs atualizadas: $($updateResp.updated) de $($updateResp.total) veículos" -ForegroundColor Green

Write-Host "`n=========================================" -ForegroundColor Yellow
Write-Host "MIGRAÇÃO CONCLUÍDA. NÃO rode o cleanup ainda!" -ForegroundColor Yellow
Write-Host "Abra o site e confira se as fotos carregam normalmente." -ForegroundColor Yellow
Write-Host "Só depois disso, peça pro Claude Code rodar a limpeza." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow