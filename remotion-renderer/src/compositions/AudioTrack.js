import React from 'react';
import { Audio } from 'remotion';

/**
 * AudioTrack Component
 * Renders background music and voiceover with proper volume levels
 */
export const AudioTrack = ({ backgroundMusic, voiceover, musicVolume = 0.2, voiceoverVolume = 1.0 }) => {
  return (
    <>
      {/* Background Music - lower volume */}
      {backgroundMusic && (
        <Audio
          src={backgroundMusic}
          volume={musicVolume}
          loop
          startFrom={0}
        />
      )}

      {/* Voiceover Narration - full volume */}
      {voiceover && (
        <Audio
          src={voiceover}
          volume={voiceoverVolume}
          startFrom={0}
        />
      )}
    </>
  );
};
