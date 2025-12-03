// Remotion Video Rendering Server
// Integrates with Enhanced MAKER infrastructure (Redis + RabbitMQ) + Supabase

require('dotenv').config({ path: '../.env' });
const express = require('express');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const Redis = require('ioredis');
const amqp = require('amqplib');
const sharp = require('sharp');
const { generateCreativeScenes } = require('./ai-scene-generator');
const { prepareAudioForVideo } = require('./audio-generator');

// Load enhanced-maker library
const enhancedMakerPath = process.env.ENHANCED_MAKER_PATH || '../enhanced-maker.js';
let EnhancedRedisStateManager, EnhancedMessageQueue, ConnectionPoolManager, CacheManager, Logger;

try {
  const lib = require(enhancedMakerPath);
  ({ EnhancedRedisStateManager, EnhancedMessageQueue, ConnectionPoolManager, CacheManager, Logger } = lib);
} catch (err) {
  console.warn('⚠️  Enhanced Maker library not found, using basic Redis/AMQP');
}

const app = express();

// CORS middleware - allow requests from Next.js UI
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const RABBITMQ_URL = process.env.MESSAGE_QUEUE_URL || 'amqp://localhost:5672';

// Initialize Supabase (for database only, not storage)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for server-side operations
);

console.log('🔑 Supabase initialized:', process.env.SUPABASE_URL ? '✓' : '✗');

// Initialize MinIO Client (S3-compatible, local or remote)
const minioClient = new S3Client({
  region: 'us-east-1', // MinIO doesn't care about region
  endpoint: process.env.MINIO_ENDPOINT || 'http://minio:9000',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'admin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minio123456',
  },
  forcePathStyle: true, // Required for MinIO
});

const MINIO_BUCKET = process.env.MINIO_BUCKET_NAME || 'videos';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';

console.log('☁️  MinIO initialized:', process.env.MINIO_ENDPOINT ? '✓' : '✗');

// Initialize infrastructure
let stateManager, messageQueue;
const redis = new Redis(REDIS_URL);

async function initInfrastructure() {
  if (EnhancedRedisStateManager) {
    const config = { redis_url: REDIS_URL, message_queue_url: RABBITMQ_URL };
    const pool = new ConnectionPoolManager(config);
    const cache = new CacheManager(60000, 100);
    const logger = new Logger('debug');
    
    stateManager = new EnhancedRedisStateManager(config, pool, logger, cache);
    messageQueue = new EnhancedMessageQueue(config, pool, logger);
    
    await stateManager.init();
    console.log('✅ Enhanced Maker infrastructure initialized');
  } else {
    console.log('ℹ️  Using basic Redis connection');
  }
}

// Helper: Generate video thumbnail
async function generateThumbnail(videoPath, executionId) {
  try {
    const thumbnailPath = path.join(__dirname, 'output', `${executionId}-thumb.png`);
    
    // For now, create a simple placeholder thumbnail
    // In production, you'd extract a frame from the video using ffmpeg
    const svg = `
      <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="#1a1a1a"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#00ff88" font-size="24" font-family="Arial">
          Video Thumbnail
        </text>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return null;
  }
}

// Helper: Upload file to MinIO (local S3-compatible storage)
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
    
    // MinIO public URL - accessible from browser at localhost:9002
    const publicUrl = `http://localhost:9002/${MINIO_BUCKET}/${key}`;
    console.log(`   ✅ Uploaded to MinIO: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Failed to upload to MinIO:`, error);
    return null;
  }
}

// Helper: Save video metadata to Supabase database
async function saveVideoMetadata(videoData) {
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert([videoData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save video metadata:', error);
    return null;
  }
}

// Helper: Update video status
async function updateVideoStatus(executionId, updates) {
  try {
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('execution_id', executionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to update video status:', error);
    return null;
  }
}

// Render endpoint
app.post('/render', async (req, res) => {
  const { executionId, composition, inputProps, outputLocation, userId } = req.body;
  
  if (!executionId || !composition) {
    return res.status(400).json({ error: 'executionId and composition are required' });
  }

  console.log(`\n🎬 Starting render for execution: ${executionId}`);
  console.log(`   Composition: ${composition}`);
  console.log(`   User ID: ${userId || 'anonymous'}`);
  console.log(`   Input Props:`, JSON.stringify(inputProps, null, 2));

  const startTime = Date.now();
  let enhancedProps = inputProps;

  try {
    // Check if we should generate creative content
    const shouldGenerateCreative = req.body.generateCreative !== false; // Default to true
    
    if (shouldGenerateCreative && inputProps) {
      // Extract description from input props
      const description = inputProps.text || 
                         inputProps.description || 
                         (inputProps.scenes && inputProps.scenes.map(s => s.content || s.props?.text).join('. '));
      
      if (description) {
        const creativeContent = await generateCreativeScenes(description, composition);
        if (creativeContent) {
          enhancedProps = creativeContent;
          console.log(`🎨 Enhanced with creative AI content`);
          console.log(`   Enhanced Props:`, JSON.stringify(enhancedProps, null, 2));
          
          // Generate audio (background music + voiceover)
          console.log(`🎵 Preparing audio...`);
          const audioConfig = await prepareAudioForVideo(
            description,
            enhancedProps.scenes || [],
            executionId
          );
          enhancedProps.audio = audioConfig;
          console.log(`   Audio ready:`, audioConfig.backgroundMusic, audioConfig.voiceover ? '+ voiceover' : '(no voiceover)');
        }
      }
    }

    // Create initial video record in Supabase
    const videoRecord = await saveVideoMetadata({
      execution_id: executionId,
      user_id: userId || null,
      composition_type: composition,
      status: 'rendering',
      input_props: inputProps || {},
      started_at: new Date().toISOString(),
    });

    // Load state from Redis
    let state = {};
    if (stateManager) {
      state = await stateManager.loadState(executionId);
      console.log('📦 Loaded state from Redis');
    } else {
      const stateJson = await redis.get(`maker:state:${executionId}`);
      if (stateJson) state = JSON.parse(stateJson);
    }

    // Update state: rendering started
    state.renderStatus = 'rendering';
    state.renderStartTime = Date.now();
    if (stateManager) {
      await stateManager.saveState({ executionId, ...state });
    } else {
      await redis.set(`maker:state:${executionId}`, JSON.stringify(state));
    }

    // Bundle Remotion project
    console.log('📦 Bundling Remotion project...');
    const bundleLocation = await bundle({
      entryPoint: path.join(__dirname, 'src/index.js'),
      webpackOverride: (config) => config,
    });

    // Get composition
    const compositionData = await selectComposition({
      serveUrl: bundleLocation,
      id: composition,
      inputProps: enhancedProps || {},
    });

    // Render video
    const outputPath = outputLocation || path.join(__dirname, 'output', `${executionId}.mp4`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    console.log('🎥 Rendering video...');
    await renderMedia({
      composition: compositionData,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: enhancedProps || {},
      crf: 28, // Higher CRF = more compression (18-28 range, 28 for smaller files)
      onProgress: ({ progress, renderedFrames, encodedFrames }) => {
        console.log(`   Progress: ${(progress * 100).toFixed(1)}% (${renderedFrames} frames)`);
      },
    });

    const renderDuration = Date.now() - startTime;
    console.log(`✅ Video rendered locally: ${outputPath}`);

    // Generate thumbnail
    console.log('📸 Generating thumbnail...');
    const thumbnailPath = await generateThumbnail(outputPath, executionId);

    // Upload to MinIO (local S3-compatible storage)
    console.log('☁️  Uploading to MinIO...');
    const videoUrl = await uploadToMinIO(
      outputPath,
      `${userId || 'anonymous'}/${executionId}.mp4`
    );

    let thumbnailUrl = null;
    if (thumbnailPath) {
      thumbnailUrl = await uploadToMinIO(
        thumbnailPath,
        `${userId || 'anonymous'}/${executionId}-thumb.png`
      );
    }

    // Get file size
    const fileStats = fs.statSync(outputPath);
    const fileSizeBytes = fileStats.size;

    // Update video record in Supabase
    await updateVideoStatus(executionId, {
      status: 'completed',
      public_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      duration_seconds: compositionData.durationInFrames / compositionData.fps,
      file_size_bytes: fileSizeBytes,
      render_duration_ms: renderDuration,
      completed_at: new Date().toISOString(),
    });

    // Update state: rendering complete
    state.renderStatus = 'completed';
    state.renderEndTime = Date.now();
    state.outputPath = outputPath;
    state.publicUrl = videoUrl;
    state.thumbnailUrl = thumbnailUrl;
    state.renderDuration = renderDuration;

    if (stateManager) {
      await stateManager.saveState({ executionId, ...state });
    } else {
      await redis.set(`maker:state:${executionId}`, JSON.stringify(state));
    }

    // Publish completion message
    if (messageQueue) {
      await messageQueue.publish('maker.render.complete', {
        executionId,
        outputPath,
        publicUrl: videoUrl,
        thumbnailUrl,
        duration: renderDuration,
        timestamp: Date.now(),
      });
    } else {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertExchange('maker.events', 'topic', { durable: true });
      await channel.publish(
        'maker.events',
        'maker.render.complete',
        Buffer.from(JSON.stringify({ executionId, outputPath, publicUrl: videoUrl, timestamp: Date.now() }))
      );
      await channel.close();
      await connection.close();
    }

    console.log(`✅ Render complete: ${videoUrl}`);
    console.log(`   Duration: ${(renderDuration / 1000).toFixed(2)}s`);
    console.log(`   File size: ${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB\n`);

    res.json({
      success: true,
      executionId,
      outputPath,
      publicUrl: videoUrl,
      thumbnailUrl,
      duration: renderDuration,
      fileSize: fileSizeBytes,
    });
  } catch (error) {
    console.error('❌ Render failed:', error);

    // Update video record as failed
    await updateVideoStatus(executionId, {
      status: 'failed',
      error_message: error.message,
    });

    // Update state: rendering failed
    const failState = {
      executionId,
      renderStatus: 'failed',
      error: error.message,
      timestamp: Date.now(),
    };

    if (stateManager) {
      await stateManager.saveState(failState);
    } else {
      await redis.set(`maker:state:${executionId}`, JSON.stringify(failState));
    }

    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'remotion-renderer' });
});

// Start server
initInfrastructure().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🎬 Remotion Renderer Server`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Redis: ${REDIS_URL}`);
    console.log(`   RabbitMQ: ${RABBITMQ_URL}`);
    console.log(`\n✨ Ready to render videos!\n`);
  });
});
