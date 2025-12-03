# Supabase Setup Instructions

## Step 1: Run the SQL Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **"+ New Query"**
5. Copy the entire contents of `supabase-schema.sql`
6. Paste into the SQL editor
7. Click **"Run"** or press `Ctrl+Enter`

You should see: "Success. No rows returned"

## Step 2: Create Storage Buckets

### Create Videos Bucket:
1. Go to **Storage** in the left sidebar
2. Click **"New bucket"**
3. Name: `videos`
4. **Public bucket**: ✅ **ENABLE** (check the box)
5. Click **"Create bucket"**

### Create Thumbnails Bucket:
1. Click **"New bucket"** again
2. Name: `thumbnails`
3. **Public bucket**: ✅ **ENABLE** (check the box)
4. Click **"Create bucket"**

## Step 3: Set Storage Policies (Important!)

### For Videos Bucket:
1. Click on the `videos` bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Select **"For full customization"**
5. Policy name: `Public read access`
6. Operation: **SELECT**
7. Policy definition:
```sql
true
```
8. Click **"Review"** then **"Save policy"**

### For Upload Policy (Videos):
1. Click **"New Policy"** again
2. Policy name: `Authenticated upload`
3. Operation: **INSERT**
4. Policy definition:
```sql
(bucket_id = 'videos'::text)
```
5. Click **"Review"** then **"Save policy"**

### Repeat for Thumbnails Bucket:
1. Click on the `thumbnails` bucket
2. Create the same two policies as above (public read + authenticated upload)

## Step 4: Verify Setup

Run this SQL query to check everything is created:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'videos', 'renders');

-- Check storage buckets
SELECT * FROM storage.buckets WHERE name IN ('videos', 'thumbnails');
```

You should see:
- 3 tables: users, videos, renders
- 2 buckets: videos, thumbnails

## Step 5: Test the Integration

Rebuild and restart the remotion-renderer:

```bash
cd /media/nmtech/VT/NGROK
docker compose build remotion-renderer
docker compose up -d remotion-renderer
```

Check logs:
```bash
docker logs remotion-renderer --tail 20
```

You should see:
```
🔑 Supabase initialized: ✓
✅ Enhanced Maker infrastructure initialized
✨ Ready to render videos!
```

## Step 6: Test Render with Supabase

```bash
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -d '{
    "executionId": "supabase-test-001",
    "composition": "TextScene",
    "userId": null,
    "inputProps": {
      "text": "Supabase Integration Test!",
      "backgroundColor": "#1a1a1a",
      "textColor": "#00ff88"
    }
  }'
```

After ~90 seconds, check Supabase:

1. Go to **Table Editor** -> **videos**
2. You should see your video record
3. Go to **Storage** -> **videos** -> **anonymous/**
4. You should see `supabase-test-001.mp4`
5. Click the file -> Copy URL -> Paste in browser to view!

## Troubleshooting

**Error: "relation public.users does not exist"**
- You didn't run the SQL schema. Go back to Step 1.

**Error: "The resource was not found"**
- Storage buckets not created. Go back to Step 2.

**Error: "new row violates row-level security policy"**
- RLS policies are too strict. Check Step 3 policies.

**Video renders but not uploaded:**
- Check docker logs: `docker logs remotion-renderer`
- Verify SUPABASE_SERVICE_KEY in `.env` file
- Check bucket is public

## Next Steps

Once Supabase is working:
1. Create Next.js UI app
2. Add authentication
3. Build video creation form
4. Display video library

All set! 🎉
