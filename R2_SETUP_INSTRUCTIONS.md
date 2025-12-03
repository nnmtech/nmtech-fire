# Cloudflare R2 Setup Instructions

## Step 1: Create Cloudflare R2 Bucket

1. Go to https://dash.cloudflare.com
2. Click **R2** in the sidebar
3. Click **Create bucket**
4. Name your bucket (e.g., `video-creator-storage`)
5. Click **Create bucket**

## Step 2: Get R2 Credentials

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Give it a name (e.g., `video-creator-app`)
4. Permissions: **Object Read & Write**
5. **Apply to specific buckets only** → Select your bucket
6. Click **Create API Token**
7. **SAVE THESE VALUES** (shown only once):
   - Access Key ID
   - Secret Access Key
   - Account ID (also shown in R2 overview)

## Step 3: Make Bucket Public (Optional)

**For direct video playback without authentication:**

1. Go to your bucket settings
2. Click **Public Access** tab
3. Click **Allow Access**
4. Your public URL will be: `https://pub-XXXXX.r2.dev`

**OR connect a custom domain:**

1. Go to **Settings** → **Public bucket domains**
2. Click **Connect Domain**
3. Enter your domain (e.g., `videos.yourdomain.com`)
4. Add CNAME record to your DNS
5. Wait for activation

## Step 4: Add to .env File

Add these lines to `/media/nmtech/VT/NGROK/.env`:

```env
# ===== Cloudflare R2 Configuration =====
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=video-creator-storage
R2_PUBLIC_URL=https://pub-XXXXX.r2.dev
```

Replace:
- `your_account_id_here` with your Account ID
- `your_access_key_id_here` with Access Key ID from Step 2
- `your_secret_access_key_here` with Secret Access Key from Step 2
- `pub-XXXXX.r2.dev` with your actual R2 public URL

## Step 5: Rebuild and Test

```bash
cd /media/nmtech/VT/NGROK
docker compose build remotion-renderer
docker compose up -d remotion-renderer
```

Then create a video and check that it uploads to R2!

## Benefits of R2 vs Supabase

✅ **10GB free storage** (vs 1GB Supabase)
✅ **No bandwidth fees** (Supabase charges $0.09/GB)
✅ **No file size limits** (Supabase default 50MB)
✅ **$0.015/GB after free tier** (vs $0.021/GB Supabase)
✅ **S3-compatible** (easy to migrate if needed)

## Costs (After Free Tier)

- Storage: $0.015/GB/month
- Class A operations (uploads): $4.50 per million
- Class B operations (downloads): $0.36 per million
- Egress: **FREE** (this is huge!)

**Example:** 100 videos (50GB) + 1,000 views/month = **~$0.75/month**
