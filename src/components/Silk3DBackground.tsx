import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Fundal homepage: mătase bej care se unduiește în 3D.
 * Shader WebGL (FBM domain-warp + iluminare din gradientul de înălțime) →
 * cute reale de țesătură cu highlight-uri și umbre, premium NOMA.
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0); // fullscreen quad
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec3  uBase;   // pale beige base
  uniform vec3  uHi;     // soft highlight
  uniform vec3  uLo;     // soft fold shadow
  uniform float uReduce; // 1 = reduced motion

  // height field: ~3 vertical waves, slightly tilted, drifting left -> right
  float waves(vec2 uv, float t){
    // tilt: shift x by y so the vertical waves are a bit inclined
    float x = uv.x + (uv.y - 0.5) * 0.20;
    float h  = sin(x * 18.85 - t);                 // 3 main vertical waves
    h += 0.32 * sin(x * 31.4 - t * 1.25 + 0.6);    // secondary detail
    h += 0.14 * sin(x * 9.4  + t * 0.55);          // slow large undulation
    return h * 0.5;
  }

  void main(){
    float t = uReduce > 0.5 ? 0.0 : uTime * 0.85;  // left -> right drift (vizibil)
    vec2 uv = vUv;

    float h = waves(uv, t);

    // soft normal from slope (small bump = calm, not too wavy)
    float e = 0.0025;
    float slopeX = (waves(uv + vec2(e, 0.0), t) - waves(uv - vec2(e, 0.0), t)) / (2.0 * e);
    float slopeY = (waves(uv + vec2(0.0, e), t) - waves(uv - vec2(0.0, e), t)) / (2.0 * e);
    float bump = 0.018; // fold strength (calm but visible)
    vec3 n = normalize(vec3(-slopeX * bump, -slopeY * bump, 1.0));

    vec3 lightDir = normalize(vec3(-0.6, 0.18, 0.78));
    float diff = clamp(dot(n, lightDir) * 0.5 + 0.5, 0.0, 1.0);

    float shade = smoothstep(0.1, 0.9, h * 0.5 + 0.5);
    vec3 col = mix(uLo, uBase, shade);
    col = mix(col, uHi, diff * 0.36); // gentle, matte

    // very subtle vignette (DOAR sus, NU jos → ca să nu întunece baza ecranului
    // unde Safari pune bara cu IP-ul; theme-color rămâne match cu culoarea văzută)
    vec2 c = vUv - 0.5;
    float vig = max(0.0, -c.y); // doar jumătatea de sus contribuie
    col *= 1.0 - vig * vig * 0.18;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* Ceasul propriu de 30fps — mătasea derivă LENT (uTime*0.85, valuri largi),
   diferența 60→30fps e imperceptibilă pe un fundal difuz, dar înjumătățește
   costul GPU pe fiecare secundă petrecută pe homepage. `frameloop="demand"`
   pe Canvas + `invalidate()` din bucla asta = R3F desenează DOAR când îi
   cerem, nu la fiecare vsync. rAF-ul se oprește singur în tab ascuns. */
const FRAME_INTERVAL_MS = 1000 / 30;

function FrameTicker() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let rafId = 0;
    let last = 0;
    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (now - last >= FRAME_INTERVAL_MS) {
        last = now;
        invalidate();
      }
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [invalidate]);
  return null;
}

function SilkPlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(
          typeof window !== 'undefined' ? window.innerWidth : 1,
          typeof window !== 'undefined' ? window.innerHeight : 1
        ),
      },
      // paletă NOMA bej/auriu — CENTRATĂ pe #e5dccb (theme-color) ca mătasea
      // și bara Safari să fie aceeași nuanță medie pe iOS
      uBase: { value: new THREE.Color('#e5dccb') }, // EXACT theme-color
      uHi: { value: new THREE.Color('#efe7d5') },   // highlight subtil deasupra
      uLo: { value: new THREE.Color('#d8cdb8') },   // cută subtilă sub theme-color
      uReduce: { value: reduce ? 1 : 0 },
    }),
    [reduce]
  );

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uResolution.value.set(
        state.size.width,
        state.size.height
      );
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function Silk3DBackground() {
  return (
    <div className="home-silk-3d" aria-hidden="true">
      {/* demand + FrameTicker = 30fps (vezi nota de sus), nu 60.
          antialias:false — MSAA netezește doar muchii de geometrie; aici e
          un singur quad fullscreen cu gradient moale, nu există nicio
          muchie de netezit, deci era cost gratuit de memorie/fill-rate.
          dpr plafonat la 1.5 (era 1.6) — pe un fundal difuz nu se vede. */}
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <FrameTicker />
        <SilkPlane />
      </Canvas>
    </div>
  );
}
