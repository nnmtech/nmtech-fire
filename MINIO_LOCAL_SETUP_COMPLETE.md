# Self-Hosted MinIO Setup - COMPLETE! ✅

## What We Built

You now have **unlimited local video storage** with S3-compatible API!

```
[Video Render] → [MinIO Docker] → [Your Local Disk]
                  localhost:9002    (unlimited storage!)
```

## How It Works Through Docker

### Architecture:
```
1. remotion-renderer renders video
2. Uploads to MinIO container (S3-compatible API)
3. MinIO stores files in Docker volume (your disk)
4. Files accessible at: http://localhost:9002/videos/...
```

### Docker Network:
- **remotion-renderer** can reach MinIO at `http://minio:9000` (internal Docker network)
- **Your browser** can reach MinIO at `http://localhost:9002` (port mapping 9002→9000)
- **No ngrok needed** for local testing (already have 1 tunnel for n8n)

## Access Points

### MinIO Console (Web UI):
👉 **http://localhost:9003**
- Username: `admin`
- Password: `minio123456`
- View files, create buckets, manage access

### MinIO API (S3-compatible):
👉 **http://localhost:9002**
- Used by remotion-renderer internally
- S3-compatible endpoint
- Files stored in `videos` bucket

### Video URLs:
- Format: `http://localhost:9002/videos/anonymous/video-123.mp4`
- Publicly accessible (no authentication)
- Can be embedded in HTML `<video>` tags

## Current Setup

### Docker Services:
```bash
docker compose ps
# Should show:
# - minio (healthy) - ports 9002:9000, 9003:9001
# - remotion-renderer (healthy) - connected to minio
# - redis, rabbitmq, n8n, etc. (unchanged)
```

### Storage Location:
```bash
# Files stored in Docker volume
docker volume inspect ngrok_minio_data
# Location: /var/lib/docker/volumes/ngrok_minio_data/_data
```

### Bucket Created:
- **Bucket name:** `videos`
- **Policy:** Public read (download)
- **Contents:** Will contain videos/anonymous/video-*.mp4

## Testing

### 1. Check MinIO Console:
```bash
# Open in browser:
http://localhost:9003

# Login: admin / minio123456
# You should see the 'videos' bucket
```

### 2. Create a Test Video:
1. Go to: **http://localhost:3000/create**
2. Enter text: "A peaceful morning in the mountains"
3. Click "Generate Video"
4. Wait for render to complete

### 3. Check Upload:
```bash
# Check remotion-renderer logs
docker logs remotion-renderer --tail 50

# Should see:
# ✅ Uploaded to MinIO: http://localhost:9002/videos/anonymous/video-123.mp4
```

### 4. View Video:
```bash
# Copy the URL from logs and open in browser:
http://localhost:9002/videos/anonymous/video-XXXXX.mp4
```

## Storage Capacity

### Unlimited!
- Uses your local disk space
- Check available space:
```bash
df -h | grep "/$"
```

### Monitor Usage:
```bash
# Check MinIO volume size
docker exec minio du -sh /data

# Check bucket size
docker exec minio mc du local/videos
```

## Benefits vs Cloud Storage

| Feature | MinIO (Local) | Supabase | R2 | Oracle |
|---------|--------------|----------|-----|--------|
| **Storage** | Unlimited* | 1GB free | 10GB free | 200GB free |
| **Bandwidth** | Unlimited | 2GB/month | 10TB/month | 10TB/month |
| **File Size Limit** | None | 50MB default | None | None |
| **Cost** | $0 | $25/month Pro | $1.35/100GB | $0 (w/ card) |
| **Setup Time** | 5 minutes | Already done | 15 minutes | 1-2 hours |
| **Credit Card** | ❌ No | ❌ No | ❌ No | ✅ Yes |

*Limited by your disk space

## Exposing to Internet (Optional)

### Option 1: ngrok (Free tier issue - already using 1 tunnel)
```bash
# Would need ngrok paid plan ($8/month) for 2nd tunnel
ngrok http 9002
```

### Option 2: Port Forwarding (Free, requires router access)
```bash
# Forward port 9002 on your router to this machine
# Videos accessible at: http://your-public-ip:9002/videos/...
```

### Option 3: Cloudflare Tunnel (Free, but more complex)
```bash
# Install cloudflared and create tunnel
# Get free subdomain: videos.your-tunnel.trycloudflare.com
```

### For Now: Local Only
- Works great for testing and development
- Videos playable in your browser
- No bandwidth costs
- Instant uploads

## Production Considerations

### When to Switch to Cloud:
1. **Need internet access** - Users outside your network
2. **Scaling** - Many concurrent users
3. **Reliability** - 24/7 uptime without your machine
4. **CDN** - Fast global delivery

### Best Next Step: Oracle Cloud (when you get card)
- 200GB free storage
- 10TB free bandwidth
- Same MinIO setup, just on cloud VM
- Follow: `R2_SETUP_INSTRUCTIONS_ORACLE.md`

## Troubleshooting

### Can't Access Console (localhost:9003):
```bash
# Check if MinIO is running
docker ps | grep minio

# Check logs
docker logs minio

# Restart if needed
docker compose restart minio
```

### Upload Fails:
```bash
# Check if bucket exists
docker exec minio mc ls local/

# Recreate bucket if needed
docker exec minio mc mb local/videos
docker exec minio mc anonymous set download local/videos
```

### Videos Won't Play:
- Check CORS (already configured in MinIO)
- Verify file exists: http://localhost:9003 (console)
- Check file permissions (should be publicly readable)

## Summary

✅ **MinIO running** - localhost:9002 (API), localhost:9003 (Console)
✅ **Bucket created** - `videos` with public read access
✅ **remotion-renderer** - configured to upload to MinIO
✅ **Unlimited storage** - uses your local disk
✅ **No credit card** - completely free
✅ **S3-compatible** - same code works with R2/Oracle/AWS later

**Ready to test!** Create a video and watch it upload to your local MinIO storage! 🎉

## Next Steps

1. Test video creation (**http://localhost:3000/create**)
2. Verify upload in console (**http://localhost:9003**)
3. Play video directly (**http://localhost:9002/videos/...**)
4. When ready for production, migrate to Oracle Cloud (same setup, cloud VM)
