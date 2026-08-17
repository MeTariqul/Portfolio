"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { setSceneReady } from "@/lib/render-store";
import { useFrameloopOnView } from "@/lib/use-frameloop-on-view";
import { SceneBoundary } from "./scene-boundary";
import * as THREE from "three";

function EnergyCore({ theme }: { theme: "dark" | "light" }) {
  const ref = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.18;
      ref.current.rotation.x += delta * 0.08;
    }
    if (shell.current) {
      shell.current.rotation.y -= delta * 0.1;
      shell.current.rotation.z += delta * 0.04;
    }
  });

  const coreColor = theme === "dark" ? "#8b5cf6" : "#6d28d9";
  const shellColor = theme === "dark" ? "#22d3ee" : "#7c3aed";

  return (
    <group>
      <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.7}>
        <mesh ref={ref}>
          <icosahedronGeometry args={[1.15, 32]} />
          <MeshDistortMaterial
            color={coreColor}
            emissive={coreColor}
            emissiveIntensity={0.45}
            distort={0.42}
            speed={2}
            metalness={0.35}
            roughness={0.15}
          />
        </mesh>
        <mesh ref={shell}>
          <icosahedronGeometry args={[1.6, 2]} />
          <meshBasicMaterial
            color={shellColor}
            wireframe
            transparent
            opacity={0.14}
          />
        </mesh>
      </Float>
    </group>
  );
}

function OrbitRings({ theme }: { theme: "dark" | "light" }) {
  const ring = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.25;
    if (ring2.current) ring2.current.rotation.z -= delta * 0.16;
  });

  const color = theme === "dark" ? "#ec4899" : "#db2777";
  const color2 = theme === "dark" ? "#22d3ee" : "#0891b2";

  return (
    <group>
      <mesh ref={ring} rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[2.35, 0.012, 8, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 1.85, 0.4, 0]}>
        <torusGeometry args={[2.9, 0.008, 8, 128]} />
        <meshBasicMaterial color={color2} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

const SHARD_COUNT = 8;

function OrbitingShards({ theme }: { theme: "dark" | "light" }) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.22;
    group.current.children.forEach((child, i) => {
      child.rotation.x += delta * (0.4 + i * 0.07);
      child.rotation.y += delta * 0.5;
      const r = 3.4 + Math.sin(clock.elapsedTime * 0.8 + i) * 0.25;
      const a = (i / SHARD_COUNT) * Math.PI * 2 + clock.elapsedTime * 0.12;
      child.position.set(Math.cos(a) * r, Math.sin(a * 1.7) * 0.9, Math.sin(a) * r);
    });
  });

  const color = theme === "dark" ? "#a5b4fc" : "#6d28d9";

  return (
    <group ref={group}>
      {Array.from({ length: SHARD_COUNT }).map((_, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[0.07 + (i % 3) * 0.03, 0]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.85}
            metalness={0.6}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig() {
  useFrame((state) => {
    const { camera, pointer } = state;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 1.1, 0.045);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.7, 0.045);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Scene({ theme }: { theme: "dark" | "light" }) {
  const isSmall =
    typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <>
      <Stars
        radius={55}
        depth={38}
        count={isSmall ? 1400 : theme === "dark" ? 4200 : 1600}
        factor={isSmall ? 2.4 : theme === "dark" ? 3.2 : 2}
        saturation={0}
        fade
        speed={theme === "dark" ? 0.9 : 0.4}
      />
      <EnergyCore theme={theme} />
      <OrbitRings theme={theme} />
      <OrbitingShards theme={theme} />
      <CameraRig />
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={theme === "dark" ? 1.0 : 0.6}
          luminanceThreshold={0.22}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.22} darkness={theme === "dark" ? 0.8 : 0.45} />
      </EffectComposer>
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 3, 4]} intensity={30} color="#8b5cf6" />
      <pointLight position={[-4, -2, 3]} intensity={18} color="#22d3ee" />
    </>
  );
}

export function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useFrameloopOnView(ref);

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        className="!absolute inset-0"
        onCreated={({ gl }) => {
          if (window.innerWidth < 768) {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
          }
          setSceneReady("hero");
        }}
      >
        <Suspense fallback={null}>
          <SceneBoundary onFallback={() => setSceneReady("hero")}>
            <Scene theme="dark" />
          </SceneBoundary>
        </Suspense>
      </Canvas>
    </div>
  );
}
