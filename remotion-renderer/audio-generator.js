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
  
  // Return path relative to bundle root (public folder is inside bundle)
  return `/public/audio/music/${selectedTrack}`;
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
 * Generate voiceover using simple TTS (Google TTS - free, open-source)
 */
async function generateVoiceover(text, outputPath) {
  const TTS_URL = process.env.TTS_URL || 'http://simple-tts:5002';
  
  try {
    console.log(`🎙️  Generating voiceover with gTTS: "${text.substring(0, 50)}..."`);
    
    const response = await axios({
      method: 'GET',
      url: `${TTS_URL}/tts`,
      params: {
        text: text,
      },
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    });

    // Save audio file
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, response.data);
    
    console.log(`✅ Voiceover saved: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Failed to generate voiceover:', error.message);
    console.log('⚠️  Continuing without voiceover');
    return null;
  }
}

/**
 * Mix background music and voiceover into a single audio file
 */
async function mixAudioTracks(musicPath, voiceoverPath, outputPath, musicVolume, voiceoverVolume) {
  return new Promise((resolve, reject) => {
    const fullMusicPath = path.join(__dirname, musicPath.replace('/public/', 'public/'));
    
    if (!voiceoverPath) {
      // No voiceover, just use music
      const { exec } = require('child_process');
      exec(`ffmpeg -i "${fullMusicPath}" -af "volume=${musicVolume}" -t 140 "${outputPath}" -y`, (error) => {
        if (error) {
          console.error('Failed to process music:', error);
          reject(error);
        } else {
          resolve(outputPath);
        }
      });
    } else {
      // Mix music and voiceover
      const { exec } = require('child_process');
      const cmd = `ffmpeg -i "${fullMusicPath}" -i "${voiceoverPath}" -filter_complex "[0:a]volume=${musicVolume}[music];[1:a]volume=${voiceoverVolume}[voice];[music][voice]amix=inputs=2:duration=first:dropout_transition=0" -t 140 "${outputPath}" -y`;
      
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error('Failed to mix audio:', error);
          reject(error);
        } else {
          console.log('✅ Audio mixed successfully');
          resolve(outputPath);
        }
      });
    }
  });
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
  
  // Generate voiceover audio
  const voiceoverOutputPath = path.join(__dirname, 'public/audio/voiceovers', `${executionId}.mp3`);
  const voiceoverPath = await generateVoiceover(script, voiceoverOutputPath);
  
  // Mix audio tracks into a single file
  const mixedAudioPath = path.join(__dirname, 'public/audio/mixed', `${executionId}.mp3`);
  fs.mkdirSync(path.dirname(mixedAudioPath), { recursive: true });
  
  await mixAudioTracks(
    musicPath,
    voiceoverPath,
    mixedAudioPath,
    0.5, // music volume
    0.8  // voiceover volume
  );
  
  console.log(`   Audio ready: mixed track at /public/audio/mixed/${executionId}.mp3`);
  
  return {
    backgroundMusic: `/public/audio/mixed/${executionId}.mp3`,
    voiceover: null, // Already mixed in
    voiceoverScript: script,
    musicVolume: 1.0,
    voiceoverVolume: 1.0,
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
