type SceneKey = "hero" | "skills";

const readyScenes = new Set<SceneKey>();
const listeners = new Set<() => void>();

export function setSceneReady(key: SceneKey) {
  if (readyScenes.has(key)) return;
  readyScenes.add(key);
  listeners.forEach((l) => l());
}

export function isSceneReady(key: SceneKey) {
  return readyScenes.has(key);
}

export function areScenesReady() {
  return readyScenes.size >= 2;
}

export function subscribeScenesReady(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}