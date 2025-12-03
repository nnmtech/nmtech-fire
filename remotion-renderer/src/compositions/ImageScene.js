// Image Scene Component with Overlay Text
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const ImageScene = ({ imageUrl, overlayText, overlayPosition }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Ken Burns effect - zoom with slight pan
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  const translateX = interpolate(frame, [0, durationInFrames], [0, -20], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Smooth text entrance - simplified to avoid range errors
  const textOpacity = interpolate(
    frame, 
    [0, 20], 
    [0, 1], 
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  
  const textScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Image fade in
  const imageOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Use fallback gradient if no image URL
  const hasValidImage = imageUrl && imageUrl.trim().length > 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Image with Ken Burns effect */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          opacity: imageOpacity,
        }}
      >
        {hasValidImage ? (
          <Img
            src={imageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${scale}) translateX(${translateX}px)`,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              transform: `scale(${scale})`,
            }}
          />
        )}
      </AbsoluteFill>
      
      {/* Vignette overlay for depth */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Overlay text with enhanced styling */}
      {overlayText && (
        <AbsoluteFill
          style={{
            justifyContent: overlayPosition === 'top' ? 'flex-start' : overlayPosition === 'bottom' ? 'flex-end' : 'center',
            alignItems: 'center',
            padding: overlayPosition === 'center' ? 80 : 60,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: overlayPosition === 'center' ? 72 : 56,
              fontWeight: overlayPosition === 'center' ? '900' : 'bold',
              color: '#fff',
              textShadow: '0 6px 20px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)',
              opacity: textOpacity,
              transform: `scale(${textScale})`,
              textAlign: 'center',
              backgroundColor: overlayPosition === 'center' ? 'transparent' : 'rgba(0,0,0,0.6)',
              padding: overlayPosition === 'center' ? '0' : '20px 50px',
              borderRadius: overlayPosition === 'center' ? 0 : 12,
              backdropFilter: overlayPosition === 'center' ? 'none' : 'blur(10px)',
              maxWidth: '90%',
              lineHeight: 1.3,
              letterSpacing: overlayPosition === 'center' ? '0.02em' : 'normal',
            }}
          >
            {overlayText}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
