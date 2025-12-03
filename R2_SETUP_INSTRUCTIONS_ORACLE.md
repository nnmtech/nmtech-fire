# Oracle Cloud + MinIO Setup for Video Storage

## Why Oracle Cloud Free Tier?

**🎉 UNBEATABLE FREE TIER:**
- ✅ **200GB storage** (vs R2's 10GB or Supabase's 1GB)
- ✅ **10TB bandwidth/month** (vs paid tiers elsewhere)
- ✅ **4 ARM CPU cores + 24GB RAM** (free forever!)
- ✅ **50Gbps network** (faster than most paid services)
- ✅ **No file size limits** (vs Supabase's 50MB)
- ✅ **S3-compatible API** (same code as R2!)

**Cost comparison for 100GB storage + 1TB bandwidth:**
- Oracle: **$0/month** (within free tier)
- Cloudflare R2: **$1.35/month** ($0.015/GB)
- Supabase: **$25/month** (Pro plan required)
- AWS S3: **$92/month** ($2.30 storage + $90 bandwidth)

---

## Step 1: Create Oracle Cloud Account

1. Go to: https://signup.cloud.oracle.com/
2. **Requirements:**
   - Valid credit card (no virtual/prepaid cards)
   - They verify but **never charge** for free tier
3. Complete signup and verify email

---

## Step 2: Create ARM VM Instance

### Login to Console
1. Login at: https://cloud.oracle.com/
2. Click hamburger menu (top left)
3. Navigate to: **Compute** → **Instances**

### Create Instance
1. Click **"Create instance"**
2. **Name:** `video-storage-server`
3. **Region:** Select one with "Always Free-eligible" badge
4. Click **"Edit"** next to "Image and Shape"

### Configure Shape (ARM for free tier)
1. Click **"Change shape"**
2. Select **"Ampere"**
3. Check box: **"VM.Standard.A1.Flex"**
4. Set resources:
   - **OCPUs:** 4 (use all your free cores)
   - **Memory:** 24 GB (use all your free RAM)
5. Click **"Select shape"**

### Choose Image
1. Click **"Change image"**
2. Select:
   - **Image:** Canonical Ubuntu (latest LTS)
   - **OS:** Ubuntu 22.04 or 24.04
3. Click **"Select image"**

### Networking
Leave defaults (creates VCN automatically)

### SSH Keys
1. Select **"Paste public keys"**
2. Paste your SSH public key:
   ```bash
   # On your local machine:
   cat ~/.ssh/id_rsa.pub
   ```
   (Or click "Generate a key pair" to download new keys)

### Boot Volume
1. **Size:** 200 GB (max free tier)
2. Leave other defaults

### Deploy
1. Click **"Create"**
2. Wait ~2 minutes for provisioning
3. Copy the **Public IP address** once it turns green

---

## Step 3: Configure Firewall Rules

### Open Ports in Oracle Cloud
1. In instance details, click **"Subnet"** link
2. Click your subnet's **"Security Lists"**
3. Click **"Add Ingress Rules"** (do this 3 times):

**Rule 1: HTTP**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port: `80`

**Rule 2: HTTPS**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port: `443`

**Rule 3: MinIO Console**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port: `9001`

**Rule 4: MinIO API**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port: `9000`

---

## Step 4: SSH into Instance and Setup

```bash
# SSH into your Oracle VM (replace with your IP)
ssh ubuntu@<YOUR_ORACLE_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo apt install docker-compose -y

# Create MinIO directories
mkdir -p ~/minio/data
mkdir -p ~/minio/config

# Open firewall on Ubuntu
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## Step 5: Deploy MinIO with Docker Compose

```bash
# Create docker-compose.yml for MinIO
cat > ~/minio/docker-compose.yml <<'EOF'
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    restart: unless-stopped
    ports:
      - "9000:9000"  # S3 API
      - "9001:9001"  # Web Console
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: YourSecurePassword123!
    volumes:
      - ./data:/data
      - ./config:/root/.minio
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  nginx:
    image: nginx:alpine
    container_name: nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - minio

networks:
  default:
    driver: bridge
EOF

# Create nginx reverse proxy config
cat > ~/minio/nginx.conf <<'EOF'
events {
    worker_connections 1024;
}

http {
    upstream minio_api {
        server minio:9000;
    }

    upstream minio_console {
        server minio:9001;
    }

    # MinIO API (S3-compatible)
    server {
        listen 80;
        server_name _;

        client_max_body_size 500M;
        proxy_request_buffering off;

        location / {
            proxy_pass http://minio_api;
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 300;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            chunked_transfer_encoding off;
        }
    }
}
EOF

# Start MinIO
cd ~/minio
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

---

## Step 6: Configure MinIO

### Access MinIO Console
1. Open browser: `http://<YOUR_ORACLE_IP>:9001`
2. Login:
   - **Username:** `admin`
   - **Password:** `YourSecurePassword123!` (from docker-compose.yml)

### Create Bucket
1. Click **"Buckets"** in sidebar
2. Click **"Create Bucket"**
3. **Bucket Name:** `video-creator-storage`
4. Click **"Create Bucket"**

### Set Public Access Policy
1. Click on your bucket
2. Go to **"Access Policy"** tab
3. Click **"Add Access Rule"**
4. Set **Prefix:** `videos/`
5. Set **Access:** `readonly` (public read)
6. Click **"Save"**

### Create Access Keys
1. Click **"Access Keys"** in sidebar
2. Click **"Create access key"**
3. **Save these values** (shown only once):
   - **Access Key**
   - **Secret Key**

---

## Step 7: Update Your Application

### Add to .env file

```bash
# ===== Oracle Cloud + MinIO Storage =====
MINIO_ENDPOINT=http://<YOUR_ORACLE_IP>:9000
MINIO_ACCESS_KEY=<your_access_key_from_step_6>
MINIO_SECRET_KEY=<your_secret_key_from_step_6>
MINIO_BUCKET_NAME=video-creator-storage
MINIO_PUBLIC_URL=http://<YOUR_ORACLE_IP>
MINIO_USE_SSL=false
```

### Update docker-compose.yaml

```yaml
  remotion-renderer:
    environment:
      # ... existing vars ...
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET_NAME=${MINIO_BUCKET_NAME}
      - MINIO_PUBLIC_URL=${MINIO_PUBLIC_URL}
      - MINIO_USE_SSL=${MINIO_USE_SSL}
```

### Update package.json (if needed)

MinIO uses same `@aws-sdk/client-s3` package as R2, so no changes needed!

### Update server.js

```javascript
// Initialize MinIO Client (S3-compatible)
const minioClient = new S3Client({
  region: 'us-east-1', // MinIO doesn't care about region
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

const MINIO_BUCKET = process.env.MINIO_BUCKET_NAME;
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL;

// Upload function (same as R2!)
async function uploadToMinIO(filePath, key) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = key.includes('.mp4') ? 'video/mp4' : 'image/png';
    
    const command = new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await minioClient.send(command);
    
    // Construct public URL
    const publicUrl = `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${key}`;
    console.log(`   ✅ Uploaded to MinIO: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Failed to upload to MinIO:`, error);
    return null;
  }
}
```

---

## Step 8: Rebuild and Deploy

```bash
cd /media/nmtech/VT/NGROK
docker compose build remotion-renderer
docker compose up -d remotion-renderer
```

---

## Step 9: Test Upload

Create a test video and verify:
1. Video renders successfully
2. Uploads to MinIO on Oracle Cloud
3. Public URL works: `http://<ORACLE_IP>/video-creator-storage/videos/...`

---

## Optional: Add Custom Domain

### With Cloudflare (Free)
1. Add your domain to Cloudflare
2. Create A record: `videos.yourdomain.com` → `<ORACLE_IP>`
3. Enable Cloudflare proxy (orange cloud)
4. Update `MINIO_PUBLIC_URL=https://videos.yourdomain.com`

### Benefits:
- Free SSL certificate
- Free CDN caching
- DDoS protection
- Bandwidth savings (Cloudflare caches popular videos)

---

## Monitoring & Maintenance

### Check MinIO Status
```bash
ssh ubuntu@<ORACLE_IP>
cd ~/minio
docker-compose logs -f
```

### Check Storage Usage
```bash
df -h
du -sh ~/minio/data
```

### Backup Important Data
```bash
# MinIO has built-in replication and versioning
# Access via console: http://<IP>:9001
```

---

## Cost Breakdown (Oracle Free Tier)

| Resource | Free Tier Limit | Your Usage | Cost |
|----------|----------------|------------|------|
| ARM Compute | 4 OCPU, 24GB RAM | 4 OCPU, 24GB | $0 |
| Boot Volume | 200 GB | 200 GB | $0 |
| Bandwidth | 10 TB/month | ~1-2 TB | $0 |
| **Total** | | | **$0/month** |

**Forever free as long as:**
- You stay within limits above
- You use your account monthly (login at least once)
- Oracle doesn't cancel free tier (unlikely)

---

## Troubleshooting

### Can't access MinIO console
```bash
# Check if services are running
docker-compose ps

# Check firewall
sudo ufw status

# Check Oracle Cloud Security List (Step 3)
```

### Upload fails with "Access Denied"
- Check access keys are correct
- Verify bucket policy allows writes
- Check MinIO console for errors

### Videos not loading in browser
- Check bucket is set to public read
- Verify nginx is running: `docker ps`
- Check CORS settings in MinIO console

---

## Next Steps

After setup is complete:
1. ✅ Test video upload
2. ✅ Verify public URL works
3. ✅ Add custom domain (optional)
4. ✅ Enable HTTPS with Cloudflare (optional)
5. ✅ Set up automated backups (optional)

You now have **200GB of free video storage** with no bandwidth costs! 🎉
