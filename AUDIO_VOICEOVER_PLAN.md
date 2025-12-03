# Audio & Voiceover Implementation Plan

## Current Status
✅ Video generation with AI scene creation  
✅ Dynamic scene durations (10s/20s/30s)  
✅ Pure visual storytelling (no text overlays on images)  
⏳ Audio/voiceover integration (planned)

## Audio Integration Options

### Option 1: Text-to-Speech (TTS) Voiceover
**Services:**
- ElevenLabs API (high quality, natural voices)
- Google Cloud Text-to-Speech
- Amazon Polly
- Azure Cognitive Services

**Implementation:**
1. Extract text from user input
2. Generate voiceover audio via TTS API
3. Store audio file in Supabase Storage
4. Pass audio URL to Remotion as `<Audio>` component
5. Sync audio timing with scene transitions

**Remotion Code:**
```javascript
import { Audio } from 'remotion';

export const VideoWithVoiceover = ({ scenes, audioUrl }) => {
  return (
    <>
      <Audio src={audioUrl} />
      {/* Scene rendering */}
    </>
  );
};
```

### Option 2: Background Music
**Services:**
- YouTube Audio Library (free)
- Epidemic Sound API
- Uppbeat
- Artlist

**Implementation:**
1. Select music based on theme (nature, tech, business, etc.)
2. Store music tracks in `/public/audio/`
3. Add to Remotion composition with volume control

**Remotion Code:**
```javascript
import { Audio } from 'remotion';

export const VideoWithMusic = ({ scenes, theme }) => {
  const musicUrl = getMusicForTheme(theme); // nature.mp3, tech.mp3, etc.
  
  return (
    <>
      <Audio src={musicUrl} volume={0.3} />
      {/* Scene rendering */}
    </>
  );
};
```

### Option 3: User-Uploaded Audio
**Implementation:**
1. Add file upload field in UI
2. Upload to Supabase Storage
3. Pass audio URL to Remotion

## Recommended Approach (Phase 1)

**Start with Background Music:**
1. Add 5-7 royalty-free music tracks (calm, energetic, corporate, nature, tech)
2. Auto-select based on theme detection
3. Volume: 30% (non-intrusive)
4. Fade in/out at start/end

**Phase 2: Add TTS Voiceover:**
1. Integrate ElevenLabs API
2. Generate voiceover from opening text scene
3. Sync with video duration
4. Add to pro tier as premium feature

## UI Changes Needed

```typescript
// Add to CreatePage state
const [audioOption, setAudioOption] = useState<'none' | 'music' | 'voiceover'>('music')
const [musicTheme, setMusicTheme] = useState<'auto' | 'calm' | 'energetic'>('auto')
const [voiceoverText, setVoiceoverText] = useState('')

// Add to form
<div className="space-y-4">
  <label className="block text-sm font-medium">Audio Options</label>
  <select value={audioOption} onChange={(e) => setAudioOption(e.target.value)}>
    <option value="none">No Audio</option>
    <option value="music">Background Music</option>
    <option value="voiceover">AI Voiceover (Pro)</option>
  </select>
</div>
```

## File Structure

```
remotion-renderer/
├── audio/
│   ├── music/
│   │   ├── calm-nature.mp3
│   │   ├── energetic-tech.mp3
│   │   ├── corporate-business.mp3
│   │   ├── creative-inspire.mp3
│   │   └── luxury-elegant.mp3
│   └── voiceovers/
│       └── (generated TTS files)
├── src/
│   ├── compositions/
│   │   └── AudioManager.js (new)
│   └── utils/
│       └── tts-generator.js (new)
```

## API Integration (ElevenLabs Example)

```javascript
// tts-generator.js
const generateVoiceover = async (text) => {
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/voice-id', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      }
    })
  });
  
  const audioBuffer = await response.arrayBuffer();
  const audioPath = `/audio/voiceovers/${Date.now()}.mp3`;
  await fs.writeFile(audioPath, Buffer.from(audioBuffer));
  return audioPath;
};
```

## Cost Estimate

**ElevenLabs TTS:**
- Free tier: 10,000 characters/month
- Paid tier: $5/month (30,000 chars) to $99/month (600,000 chars)
- Average video: ~500 characters = ~$0.08 per video

**Background Music:**
- Royalty-free (YouTube Audio Library): FREE
- Epidemic Sound: $15/month (commercial use)

## Next Steps

1. ✅ Remove text overlays from images (DONE)
2. Add 5 background music tracks to `/remotion-renderer/public/audio/`
3. Create `AudioManager` component
4. Update `MultiSceneVideo` to include audio
5. Add audio toggle in UI
6. Test audio sync with scene transitions
7. (Future) Integrate ElevenLabs TTS for voiceover

## Performance Notes

- Audio files should be compressed (MP3, 128kbps)
- Keep music loops under 3MB each
- Cache TTS results in Supabase to avoid regeneration
- Consider lazy loading audio files
