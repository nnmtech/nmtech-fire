// Audio Generation Module for Remotion Videos
// Handles background music selection and AI voiceover generation

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah voice

/**
 * Select background music based on detected mood/theme
 */
function selectBackgroundMusic(mood, theme) {
  const musicMap = {
    serene: 'calm-peaceful.mp3',
    peaceful: 'calm-peaceful.mp3',
    calm: 'calm-peaceful.mp3',
    energetic: 'upbeat-inspiring.mp3',
    inspiring: 'upbeat-inspiring.mp3',
    upbeat: 'upbeat-inspiring.mp3',
    mysterious: 'dramatic-cinematic.mp3',
    dramatic: 'dramatic-cinematic.mp3',
    epic: 'dramatic-cinematic.mp3',
  };

  const selectedTrack = musicMap[mood.toLowerCase()] || 'calm-peaceful.mp3';
  return `/audio/music/${selectedTrack}`;
}

/**
 * Generate voiceover script from input description
 * Expands and enriches the text for narration
 */
function generateVoiceoverScript(description, scenes) {
  // Extract key concepts from description
  const sentences = description.split(/[.!?]+/).filter(s => s.trim());
  
  // Create natural narration flow
  const intro = sentences[0]?.trim() || description;
  const sceneCount = scenes.length;
  
  // Build narrative script
  let script = `${intro}. `;
  
  // Add scene-based narration
  if (sceneCount > 2) {
    script += `Watch as we explore ${sceneCount} unique perspectives. `;
  }
  
  // Add thematic conclusion based on mood
  const keywords = description.toLowerCase();
  if (keywords.includes('peaceful') || keywords.includes('calm')) {
    script += `Experience the tranquility and beauty of this moment.`;
  } else if (keywords.includes('energy') || keywords.includes('vibrant')) {
    script += `Feel the energy and excitement come to life.`;
  } else if (keywords.includes('mountain') || keywords.includes('nature')) {
    script += `Discover the majesty and wonder of the natural world.`;
  } else {
    script += `Journey through this visual story.`;
  }
  
  return script;
}

/**
 * Generate voiceover using ElevenLabs API
 */
async function generateVoiceover(text, outputPath) {
  if (!ELEVENLABS_API_KEY) {
    console.log('⚠️  ElevenLabs API key not set, skipping voiceover generation');
    return null;
  }

  try {
    console.log(`🎙️  Generating voiceover: "${text.substring(0, 50)}..."`);
    
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      responseType: 'arraybuffer',
    });

    // Save audio file
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, response.data);
    
    console.log(`✅ Voiceover saved: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Failed to generate voiceover:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Prepare audio for video composition
 * Returns audio configuration for Remotion
 */
async function prepareAudioForVideo(description, scenes, executionId) {
  const mood = detectMoodFromDescription(description);
  
  // Select background music
  const musicPath = selectBackgroundMusic(mood, '');
  
  // Generate voiceover script
  const script = generateVoiceoverScript(description, scenes);
  
  // Generate voiceover audio (if API key available)
  const voiceoverOutputPath = path.join(__dirname, 'public/audio/voiceovers', `${executionId}.mp3`);
  const voiceoverPath = await generateVoiceover(script, voiceoverOutputPath);
  
  return {
    backgroundMusic: musicPath,
    voiceover: voiceoverPath ? `/audio/voiceovers/${executionId}.mp3` : null,
    voiceoverScript: script,
    musicVolume: 0.2, // 20% volume for background music
    voiceoverVolume: 1.0, // 100% volume for narration
  };
}

/**
 * Helper: Detect mood from description text
 */
function detectMoodFromDescription(text) {
  const lowerText = text.toLowerCase();
  
  if (/(peaceful|calm|serene|tranquil|quiet|gentle|soft)/.test(lowerText)) {
    return 'serene';
  }
  if (/(energy|vibrant|lively|dynamic|active|exciting|upbeat)/.test(lowerText)) {
    return 'energetic';
  }
  if (/(dramatic|intense|powerful|epic|cinematic|mysterious)/.test(lowerText)) {
    return 'dramatic';
  }
  if (/(inspiring|motivational|uplifting|hopeful|positive)/.test(lowerText)) {
    return 'inspiring';
  }
  
  return 'calm'; // default
}

module.exports = {
  selectBackgroundMusic,
  generateVoiceoverScript,
  generateVoiceover,
  prepareAudioForVideo,
};
