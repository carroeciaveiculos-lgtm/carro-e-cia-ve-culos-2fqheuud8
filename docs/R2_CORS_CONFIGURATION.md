# R2 Bucket CORS Configuration

## Problem

Vehicle images hosted on the R2 bucket (`imagens.carroeciamotors.com.br`) fail to load with `Failed to fetch` errors when the browser requests them with `crossOrigin="anonymous"` (required for canvas/html-to-image operations). This happens because the R2 bucket does not have CORS rules configured to allow requests from the frontend origins.

## Solution

Configure CORS rules on the Cloudflare R2 bucket to allow GET requests from the frontend domains.

## Steps to Apply via Cloudflare Dashboard

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage** in the left sidebar
3. Click on the bucket named `carroeciamotors` (serves `imagens.carroeciamotors.com.br`)
4. Go to the **Settings** tab
5. Scroll to the **CORS Policy** section
6. Click **Add CORS policy**
7. Paste the following JSON configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://www.carroeciamotors.com.br",
      "https://carroeciamotors.com.br",
      "https://carro-e-cia-veiculos-bf939--preview.goskip.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 86400
  }
]
```

8. Click **Save**

## Steps to Apply via Cloudflare API (Alternative)

```bash
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2/buckets/carroeciamotors/cors" \
  -H "Authorization: Bearer {CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "AllowedOrigins": [
          "https://www.carroeciamotors.com.br",
          "https://carroeciamotors.com.br",
          "https://carro-e-cia-veiculos-bf939--preview.goskip.app",
          "http://localhost:5173"
        ],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
        "MaxAgeSeconds": 86400
      }
    ]
  }'
```

## Verification

After applying the CORS policy, verify by running:

```bash
curl -I -H "Origin: https://www.carroeciamotors.com.br" \
  "https://imagens.carroeciamotors.com.br/media/test.jpg"
```

The response should include:

```
Access-Control-Allow-Origin: https://www.carroeciamotors.com.br
```

## Frontend Fallback

Even with CORS properly configured, the frontend includes robust fallback handling:

1. **`handleImageError`** in `src/lib/image-utils.ts` retries image loading without `crossOrigin` before falling back to a placeholder
2. **`getSafeImageUrlForCapture`** provides a transparent placeholder for `html-to-image` operations
3. **Global error handler** in `src/App.tsx` catches all image load failures and applies the fallback
4. **Database migration** `20260722233500` sanitizes unescaped spaces and parentheses in all vehicle photo/video URLs
