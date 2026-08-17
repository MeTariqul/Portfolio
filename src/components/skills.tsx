"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { SectionHeading } from "./section-heading";
import { setSceneReady } from "@/lib/render-store";
import { useFrameloopOnView } from "@/lib/use-frameloop-on-view";
import { SceneBoundary } from "./scene-boundary";
import * as THREE from "three";

const FRONTEND = ["React", "Next.js", "TypeScript", "Tailwind", "Framer Motion", "Three.js", "shadcn/ui", "Zustand"];
const BACKEND = ["Node.js", "PostgreSQL", "Prisma", "Redis", "REST", "JWT", "Vercel", "Cloudflare"];
const AI = ["OpenAI", "Gemini", "LangChain", "OCR", "PDF", "RAG", "Pipelines", "Prompt Eng"];
const PYTHON = ["Python", "FastAPI", "Django", "pandas", "NumPy", "Selenium", "BeautifulSoup", "Scikit-learn"];

function TextSprite({ text, color }: { text: string; color: string }) {
  const { texture, aspect } = useMemo(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const fontSize = 96;
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    const width = Math.ceil(ctx.measureText(text).width) + fontSize;
    canvas.width = width;
    canvas.height = Math.ceil(fontSize * 1.6);
    const c = canvas.getContext("2d")!;
    c.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    c.fillStyle = color;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, canvas.width / 2, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return { texture: tex, aspect: canvas.width / canvas.height };
  }, [text, color]);

  const height = 0.34;

  return (
    <sprite scale={[height * aspect, height, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

type RingProps = {
  items: string[];
  radius: number;
  speed: number;
  color: string;
  tilt: number;
  y: number;
};

function Ring({ items, radius, speed, color, tilt, y }: RingProps) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * speed;
  });

  return (
    <group ref={group} rotation={[tilt, 0, 0]} position={[0, y, 0]}>
      {items.map((item, i) => {
        const a = (i / items.length) * Math.PI * 2;
        const x = Math.cos(a) * radius;
        const z = Math.sin(a) * radius;
        return (
          <group key={item} position={[x, 0, z]}>
            <TextSprite text={item} color={color} />
          </group>
        );
      })}
    </group>
  );
}

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.4;
    const s = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.06;
    ref.current.scale.setScalar(s);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.55, 48, 48]} />
      <meshStandardMaterial
        color="#8b5cf6"
        emissive="#8b5cf6"
        emissiveIntensity={0.5}
        metalness={0.4}
        roughness={0.2}
      />
    </mesh>
  );
}

function SkillScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 4, 5]} intensity={40} color="#8b5cf6" />
      <pointLight position={[-5, -3, 4]} intensity={30} color="#22d3ee" />
      <Core />
      <Ring
        items={FRONTEND}
        radius={2.4}
        speed={0.24}
        color="#c4b5fd"
        tilt={0.35}
        y={0}
      />
      <Ring
        items={BACKEND}
        radius={3.5}
        speed={-0.17}
        color="#67e8f9"
        tilt={-0.5}
        y={0.1}
      />
      <Ring
        items={AI}
        radius={4.6}
        speed={0.11}
        color="#f9a8d4"
        tilt={0.9}
        y={-0.2}
      />
      <Ring
        items={PYTHON}
        radius={5.6}
        speed={-0.08}
        color="#86efac"
        tilt={-1.05}
        y={0}
      />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.6}
      />
    </>
  );
}

export function Skills() {
  const t = useTranslations("skills");
  const sceneRef = useRef<HTMLDivElement>(null);
  const inView = useFrameloopOnView(sceneRef);

  return (
    <section id="skills" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8 lg:py-36">
      <SectionHeading number="04" label={t("label")} title={t("heading")} sub={t("sub")} align="center" />

      <motion.div
        ref={sceneRef}
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto mt-16 h-[420px] w-full max-w-3xl sm:h-[520px]"
      >
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon/10 blur-3xl"
        />
        <Canvas
          camera={{ position: [0, 0.4, 9], fov: 45 }}
          dpr={[1, 1.5]}
          frameloop={inView ? "always" : "never"}
          className="!absolute inset-0"
          onCreated={({ gl }) => {
            gl.domElement.style.touchAction = "pan-y";
            setSceneReady("skills");
          }}
        >
          <Suspense fallback={null}>
            <SceneBoundary onFallback={() => setSceneReady("skills")}>
              <SkillScene />
            </SceneBoundary>
          </Suspense>
        </Canvas>
      </motion.div>
    </section>
  );
}
