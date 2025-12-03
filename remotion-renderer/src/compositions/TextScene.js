// Simple Text Scene Component
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const TextScene = ({ text, backgroundColor, textColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Smooth entrance - simplified
  const opacity = interpolate(
    frame,
    [0, 20],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Dynamic scale animation with bounce
  const scale = interpolate(frame, [0, 25], [0.5, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  // Subtle rotation for dynamism
  const rotate = interpolate(frame, [0, 20], [-2, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Add subtle glow effect
  const glowIntensity = interpolate(
    frame,
    [0, 20],
    [0, 25],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${backgroundColor} 0%, ${adjustColor(backgroundColor, -20)} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Animated background elements */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${50 + Math.sin(frame * 0.02) * 20}% ${50 + Math.cos(frame * 0.02) * 20}%, ${adjustColor(backgroundColor, 10)} 0%, transparent 50%)`,
          opacity: 0.3,
        }}
      />
      
      <div
        style={{
          fontSize: 110,
          fontWeight: '900',
          color: textColor,
          opacity,
          transform: `scale(${scale}) rotate(${rotate}deg)`,
          textAlign: 'center',
          padding: '0 120px',
          textShadow: `0 0 ${glowIntensity}px ${textColor}40, 0 4px 12px rgba(0,0,0,0.5)`,
          letterSpacing: '0.02em',
          lineHeight: 1.2,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// Helper to adjust color brightness
function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
