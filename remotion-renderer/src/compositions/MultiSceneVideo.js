// Multi-Scene Video Component
import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { TextScene } from './TextScene';
import { ImageScene } from './ImageScene';

export const MultiSceneVideo = ({ scenes }) => {
  // scenes format: [{ type: 'text', duration: 90, props: {...} }, { type: 'image', duration: 120, props: {...} }]
  
  console.log('MultiSceneVideo rendering with scenes:', JSON.stringify(scenes, null, 2));
  
  if (!scenes || scenes.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: 40 }}>No scenes configured</div>
      </AbsoluteFill>
    );
  }

  // Calculate frame positions before rendering
  const sceneTimings = scenes.reduce((acc, scene, index) => {
    const sceneDuration = scene.duration || 90;
    const sceneStart = index === 0 ? 0 : acc[index - 1].end;
    acc.push({ start: sceneStart, duration: sceneDuration, end: sceneStart + sceneDuration });
    return acc;
  }, []);

  console.log('Scene timings:', sceneTimings);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {scenes.map((scene, index) => {
        const { start: sceneStart, duration: sceneDuration } = sceneTimings[index];
        const isLastScene = index === scenes.length - 1;

        return (
          <Sequence key={index} from={sceneStart} durationInFrames={sceneDuration}>
            <SceneWithTransition isLast={isLastScene}>
              {scene.type === 'text' && (
                <TextScene
                  text={scene.props.text || 'No text provided'}
                  backgroundColor={scene.props.backgroundColor || '#000'}
                  textColor={scene.props.textColor || '#fff'}
                />
              )}
              {scene.type === 'image' && (
                <ImageScene
                  imageUrl={scene.props.imageUrl}
                  overlayText={scene.props.overlayText}
                  overlayPosition={scene.props.overlayPosition || 'bottom'}
                />
              )}
            </SceneWithTransition>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Transition wrapper component
const SceneWithTransition = ({ children, isLast }) => {
  const frame = useCurrentFrame();
  
  // Fade in at start (10 frames)
  const fadeIn = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {children}
    </AbsoluteFill>
  );
};
