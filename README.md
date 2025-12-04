# AI Video Creator with Audio

An intelligent video generation platform that creates multi-scene videos with background music and AI-generated voiceovers. Built with Next.js, Remotion, and Docker.

## ✨ Features

- **🎬 Multi-Scene Video Generation**: Automatically creates 6-8 dynamic scenes from text descriptions
- **🎵 Background Music**: Mood-based music selection (calm, upbeat, cinematic, etc.)
- **🎙️ AI Voiceover**: Open-source text-to-speech narration using gTTS
- **🎨 Creative AI**: Generates varied visual compositions with images and text overlays
- **💾 Unlimited Storage**: Self-hosted MinIO storage (no upload size limits)
- **🐳 Fully Dockerized**: Easy deployment with docker-compose
- **🌐 Public Sharing**: Ngrok integration for instant video sharing

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Next.js UI     │────▶│ Remotion Renderer│────▶│  MinIO Storage  │
│  (Port 3000)    │     │  (Port 3001)     │     │  (Port 9002)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                        ┌──────┴──────┐
                        ▼              ▼
                  ┌───────────┐  ┌──────────┐
                  │ Simple TTS│  │  N8N     │
                  │(Port 5002)│  │(Port 5678)│
                  └───────────┘  └──────────┘
```

### Components

- **video-creator-ui**: Next.js frontend with Tailwind CSS
- **remotion-renderer**: Video rendering engine with creative AI
- **simple-tts**: Open-source TTS service using Google Text-to-Speech
- **minio**: S3-compatible object storage (unlimited capacity)
- **n8n**: Workflow automation (optional)
- **ngrok**: Public URL tunneling

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- 4GB+ RAM recommended
- 10GB+ disk space for videos and music

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nnmtech/nmtech-fire.git
   cd nmtech-fire
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your settings:
   ```env
   # MinIO Storage
   MINIO_ENDPOINT=http://minio:9000
   MINIO_ACCESS_KEY=admin
   MINIO_SECRET_KEY=minio123456
   MINIO_BUCKET=videos
   
   # Simple TTS
   SIMPLE_TTS_URL=http://simple-tts:5002
   
   # Ngrok (optional)
   NGROK_AUTHTOKEN=your_token_here
   NGROK_DOMAIN=your-domain.ngrok-free.app
   ```

3. **Start all services**
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - UI: http://localhost:3000
   - MinIO Console: http://localhost:9003 (admin/minio123456)
   - N8N: http://localhost:5678

### Create Your First Video

1. Navigate to http://localhost:3000/create
2. Enter a creative description (e.g., "A peaceful sunrise over mountains with birds flying")
3. Select "Creative Mode" for multi-scene generation
4. Choose "Both Music + Voiceover"
5. Click "Generate Video"
6. Wait 2-3 minutes for rendering
7. Your video will open in a new tab!

## 🎵 Audio System

### How It Works

The audio system combines background music with AI-generated voiceovers:

1. **Music Selection**: Mood is detected from your description (peaceful → calm music, exciting → upbeat music)
2. **Voiceover Generation**: Description is expanded into a narrative script and converted to speech using gTTS
3. **Audio Mixing**: Music and voiceover are pre-mixed with ffmpeg (50% music volume, 80% voiceover volume)
4. **Video Integration**: Mixed audio is synchronized with video during Remotion rendering

### Music Library

Current music tracks:
- **Calm**: SoundHelix - Ambient Piano
- **Upbeat**: (Add more tracks to `/remotion-renderer/public/audio/music/`)
- **Cinematic**: (Add more tracks)
- **Energetic**: (Add more tracks)

To add more music:
1. Download royalty-free MP3 files
2. Place in `/remotion-renderer/public/audio/music/`
3. Update `selectBackgroundMusic()` in `audio-generator.js`

### TTS Service

Uses **gTTS (Google Text-to-Speech)**:
- Free and open-source
- No API key required
- Supports multiple languages
- Good quality natural voices

## 📁 Project Structure

```
NGROK/
├── video-creator-ui/          # Next.js frontend
│   ├── app/
│   │   ├── create/           # Video creation page
│   │   └── library/          # Video history (coming soon)
│   └── components/           # React components
├── remotion-renderer/         # Video rendering backend
│   ├── server.js            # Express API server
│   ├── ai-scene-generator.js # Creative AI logic
│   ├── audio-generator.js   # Audio mixing & TTS
│   └── src/compositions/    # Remotion video components
│       ├── MultiSceneVideo.js
│       ├── AudioTrack.js
│       ├── ImageScene.js
│       └── TextScene.js
├── simple-tts/               # Text-to-speech service
│   ├── server.py            # Flask TTS API
│   └── Dockerfile
├── docker-compose.yaml       # Service orchestration
└── README.md                # This file
```

## 🎨 Creative AI Features

The AI generates varied scenes with:

- **Scene Types**: Image scenes, text overlays, split screens, minimalist designs
- **Dynamic Durations**: Each scene has different timing (10-30 seconds)
- **Color Schemes**: Automatically generates matching colors
- **Transitions**: Smooth fade effects between scenes
- **Total Duration**: 2-3 minutes of content

Example scene generation:
```javascript
{
  "type": "image",
  "image": "/images/mountain-sunrise.jpg",
  "title": "A New Beginning",
  "duration": 300,  // 10 seconds
  "backgroundColor": "#1a1a2e",
  "textColor": "#eee"
}
```

## 🔧 Configuration

### Video Settings

Edit `remotion-renderer/server.js`:
```javascript
const defaultProps = {
  fps: 30,              // Frames per second
  durationInFrames: 300, // 10 seconds (for simple mode)
  width: 1920,
  height: 1080
};
```

### Audio Settings

Edit `remotion-renderer/audio-generator.js`:
```javascript
// Adjust volume levels
[0:a]volume=0.5[music];    // 50% music volume
[1:a]volume=0.8[voice]     // 80% voiceover volume
```

### Storage Settings

MinIO configuration in `.env`:
```env
MINIO_ENDPOINT=http://minio:9000
MINIO_PUBLIC_URL=http://localhost:9002  # For external access
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=minio123456
```

## 🐛 Troubleshooting

### Videos are too short (5 seconds)
- Ensure "Creative Mode" is selected in UI
- Check that `generateCreativeScenes()` returns MultiSceneVideo format

### No audio in videos
- Check simple-tts service: `docker compose logs simple-tts`
- Verify music files exist in `/remotion-renderer/public/audio/music/`
- Check ffmpeg mixing logs: `docker compose logs remotion-renderer`

### Can't hear background music
- Music tracks may be too quiet
- Replace with louder tracks (aim for -20 to -30 dB mean volume)
- Test track volume: `ffmpeg -i music.mp3 -af "volumedetect" -f null -`

### MinIO connection errors
- Verify MinIO is running: `docker compose ps minio`
- Check endpoint URL format (use `forcePathStyle: true` in S3 client)
- Access MinIO console: http://localhost:9003

### Render failures
- Check logs: `docker compose logs remotion-renderer`
- Verify all services are healthy: `docker compose ps`
- Restart renderer: `docker compose restart remotion-renderer`

### Out of disk space
- MinIO stores videos in `minio_data` volume
- Check usage: `docker system df -v`
- Clean old videos: Access MinIO console and delete from bucket

## 🔐 Security Notes

**For Production:**

1. **Change default credentials**
   ```env
   MINIO_ACCESS_KEY=your_secure_key
   MINIO_SECRET_KEY=your_secure_secret
   ```

2. **Enable authentication** in video-creator-ui (Supabase configured but not enforced)

3. **Use environment variables** - Never commit secrets to git

4. **Restrict MinIO bucket access** - Current setup allows public read (suitable for sharing)

5. **Use HTTPS** - Configure ngrok with custom domain or use reverse proxy

## 📊 Performance

**Typical render times:**
- Simple mode (10 seconds): ~30 seconds
- Creative mode (2 minutes): ~2-3 minutes
- With audio: +30 seconds for mixing

**Resource usage:**
- CPU: 1-2 cores during rendering
- RAM: 2-3GB total for all services
- Disk: ~50-100MB per video

## 🛣️ Roadmap

- [x] Multi-scene video generation
- [x] Background music integration
- [x] AI voiceover with gTTS
- [x] MinIO unlimited storage
- [ ] User authentication system
- [ ] Video library/history page
- [ ] Real-time render progress
- [ ] More music tracks (50+ tracks)
- [ ] Custom music upload
- [ ] Multiple voice options
- [ ] Video editing capabilities
- [ ] Mobile app

## 📝 API Reference

### POST /render

Render a new video.

**Request:**
```json
{
  "description": "A peaceful sunset over the ocean",
  "composition": "MultiSceneVideo",
  "creative": true,
  "theme": "nature",
  "mood": "peaceful",
  "audioEnabled": true,
  "voiceoverEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "videoUrl": "http://localhost:9002/videos/anonymous/video-abc123.mp4",
  "duration": 120,
  "scenes": 7
}
```

### GET /health

Check service health status.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Credits

**Technologies:**
- [Remotion](https://remotion.dev) - Video rendering
- [Next.js](https://nextjs.org) - Frontend framework
- [MinIO](https://min.io) - Object storage
- [gTTS](https://github.com/pndurette/gTTS) - Text-to-speech
- [ffmpeg](https://ffmpeg.org) - Audio processing

**Music:**
- [SoundHelix](https://www.soundhelix.com) - Royalty-free music
- [Incompetech](https://incompetech.com) - Creative Commons music

**Images:**
- [Unsplash](https://unsplash.com) - Free stock photos
- [Pexels](https://pexels.com) - Free stock photos

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using AI-powered video generation**
