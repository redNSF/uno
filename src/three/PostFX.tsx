/**
 * PostFX.tsx — Post-processing effects
 */

import React from 'react';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  SMAA,
  DepthOfField,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { Vector2 } from 'three';
import { useUnoStore } from '../game/store';

export function PostFX() {
  const game = useUnoStore((s) => s.game);
  const pendingWild = useUnoStore((s) => s.pendingWildColor);

  const isColorPick = pendingWild;
  const isGameEnd = game?.phase === 'game-end';

  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom
        intensity={isGameEnd ? 2.5 : 0.8}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        kernelSize={KernelSize.LARGE}
      />
      <Vignette eskil={false} offset={0.3} darkness={0.7} />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new Vector2(isColorPick ? 0.004 : 0.001, isColorPick ? 0.004 : 0.001)}
        radialModulation={false}
        modulationOffset={0}
      />
      {isColorPick ? (
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.5}
          bokehScale={4}
        />
      ) : <></>}
      {isGameEnd ? (
        <Noise opacity={0.04} />
      ) : <></>}
    </EffectComposer>
  );
}
