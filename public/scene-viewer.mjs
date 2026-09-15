import * as T from './vendor/three.module.js';
import { createFrameLoop, advanceMotion } from './render-loop.mjs';
import { batchStaticMeshes } from './scene-batching.mjs';

let sharedRenderer;
function getRenderer() {
  // Keep one WebGL context and the uploaded GLB resources across slide changes.
  if (!sharedRenderer) {
    sharedRenderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    sharedRenderer.toneMapping = T.ACESFilmicToneMapping;
    sharedRenderer.shadowMap.enabled = true;
    sharedRenderer.shadowMap.type = T.PCFSoftShadowMap;
    sharedRenderer.shadowMap.autoUpdate = false;
  }
  return sharedRenderer;
}

export function mountScene(el, slide, component, { root, gateModel, varal }) {
  const renderer = getRenderer();
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', slide === 4 ? 'Modelo 3D do componente selecionado' : 'Modelo 3D conceitual do protótipo');
  el.appendChild(canvas);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(36, 1, .1, 100);
  scene.add(new T.HemisphereLight(0xffffff, 0x6e846d, 3));
  const light = new T.DirectionalLight(0xfffae8, 4);
  light.position.set(3, 7, 5);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
  light.shadow.bias = -.001;
  scene.add(light, root);

  const protectedMeshes = new Set(gateModel ? [gateModel.beacon, ...gateModel.wheels] : []);
  const mergedMeshes = batchStaticMeshes(root, protectedMeshes);
  root.traverse(mesh => {
    if (mesh.isMesh && !protectedMeshes.has(mesh)) { mesh.updateMatrix(); mesh.matrixAutoUpdate = false; }
  });
  const isComponent = slide === 4;
  let radius = isComponent ? 8 : slide === 0 ? 21 : slide === 3 ? 16 : 11;
  let yaw = slide === 0 ? -.55 : slide === 3 ? .22 : .65;
  let pitch = slide === 3 ? .43 : .65;
  const focus = isComponent ? (component === 1 || component === 3 ? .6 : .1) : 1;
  const initial = { radius, yaw, pitch };
  const floor = new T.Mesh(new T.PlaneGeometry(200, 200), new T.MeshStandardMaterial({ color: 0xdfe6db, roughness: .6 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = isComponent ? -.46 : -.08;
  floor.receiveShadow = true;
  const grid = new T.GridHelper(24, 48, 0xc4d1bd, 0xd1daca);
  grid.position.y = floor.position.y + .002;
  scene.add(floor, grid);

  let active = 0, amount = 0, lastTime = null, rainTime = performance.now();
  let disposed = false, contextLost = false, inView = true, dragging = false, px = 0, py = 0;
  let width = 0, height = 0, pixelRatio = 0, frames = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const diagnostics = new URLSearchParams(location.search).has('perf');
  const loop = createFrameLoop(time => {
    if (disposed || contextLost) return false;
    const seconds = lastTime === null ? 1 / 60 : Math.min(.1, Math.max(0, (time - lastTime) / 1000));
    lastTime = time;
    const previous = amount;
    amount = reduced.matches ? active : advanceMotion(amount, active, seconds);
    const raining = !!varal && active === 1 && !reduced.matches;
    if (gateModel) {
      gateModel.leaf.position.x = -1.92 + amount * 4.2;
      gateModel.gear.rotation.z = -amount * 4.2 / .13;
      gateModel.wheels.forEach(wheel => wheel.rotation.y = amount * 4.2 / .11);
      gateModel.person.position.z = 3 - amount * 1.4;
    }
    if (varal) {
      varal.rack.position.x = 1.5 - amount * 3.05;
      if (raining) { rainTime += seconds * 1000; varal.updateRain(rainTime); }
    }
    if (previous !== amount || raining) renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    if (diagnostics) {
      canvas.dataset.frames = String(++frames);
      canvas.dataset.drawCalls = String(renderer.info.render.calls);
      canvas.dataset.triangles = String(renderer.info.render.triangles);
      canvas.dataset.mergedMeshes = String(mergedMeshes);
      canvas.dataset.geometries = String(renderer.info.memory.geometries);
      canvas.dataset.textures = String(renderer.info.memory.textures);
    }
    return amount !== active || raining;
  });

  function cameraUpdate() {
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * radius, Math.sin(pitch) * radius + focus, Math.cos(yaw) * Math.cos(pitch) * radius);
    camera.lookAt(0, focus, 0);
    loop.invalidate();
  }
  function resize() {
    const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
    const ratio = Math.min(devicePixelRatio, 2);
    if (w === width && h === height && ratio === pixelRatio) return;
    width = w; height = h; pixelRatio = ratio;
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    loop.invalidate();
  }
  function applyTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    const bg = dark ? 0x192821 : 0xdfe6db;
    renderer.setClearColor(bg, 1);
    floor.material.color.setHex(bg);
    grid.material.vertexColors = false;
    grid.material.color.setHex(dark ? 0x3c5545 : 0xc4d1bd);
    grid.material.opacity = dark ? .32 : .7;
    grid.material.transparent = true;
    renderer.toneMappingExposure = dark ? .72 : .85;
    loop.invalidate();
  }
  function visibilityChanged() {
    lastTime = null;
    loop.setVisible(!document.hidden && inView && !contextLost);
  }
  function pointerDown(e) { dragging = true; px = e.clientX; py = e.clientY; canvas.setPointerCapture(e.pointerId); }
  function pointerMove(e) {
    if (!dragging) return;
    yaw -= (e.clientX - px) * .008;
    pitch = Math.max(.15, Math.min(1.45, pitch + (e.clientY - py) * .006));
    px = e.clientX; py = e.clientY; cameraUpdate();
  }
  function pointerUp() { dragging = false; }
  function wheel(e) { e.preventDefault(); radius = Math.max(isComponent ? 3.5 : 6, Math.min(22, radius + e.deltaY * .012)); cameraUpdate(); }
  function lost(e) { e.preventDefault(); contextLost = true; visibilityChanged(); }
  function restored() { contextLost = false; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; visibilityChanged(); }
  function motionChanged() { lastTime = null; renderer.shadowMap.needsUpdate = true; loop.invalidate(); }
  const bindings = [['pointerdown', pointerDown], ['pointermove', pointerMove], ['pointerup', pointerUp], ['pointercancel', pointerUp], ['wheel', wheel, { passive: false }], ['webglcontextlost', lost], ['webglcontextrestored', restored]];
  bindings.forEach(args => canvas.addEventListener(...args));
  window.addEventListener('themechange', applyTheme);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', visibilityChanged);
  reduced.addEventListener('change', motionChanged);
  const observer = new ResizeObserver(resize);
  observer.observe(el);
  const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => { inView = entries[0].isIntersecting; visibilityChanged(); });
  intersection?.observe(el);
  if (gateModel) { gateModel.person.visible = slide === 3; gateModel.waves.visible = false; }
  applyTheme(); resize(); cameraUpdate();
  renderer.shadowMap.needsUpdate = true;
  visibilityChanged();

  return {
    setActive(value) {
      active = value ? 1 : 0;
      lastTime = null;
      if (gateModel) { gateModel.waves.visible = slide === 3 && !!active; gateModel.beacon.material.color.setHex(active ? 0xbafa68 : 0xdca347); }
      if (varal) varal.drops.visible = !!active;
      renderer.shadowMap.needsUpdate = true;
      loop.invalidate();
    },
    reset() { ({ radius, yaw, pitch } = initial); cameraUpdate(); },
    dispose() {
      if (disposed) return;
      disposed = true; loop.dispose(); observer.disconnect(); intersection?.disconnect();
      bindings.forEach(([name, listener]) => canvas.removeEventListener(name, listener));
      window.removeEventListener('themechange', applyTheme);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibilityChanged);
      reduced.removeEventListener('change', motionChanged);
      const geometries = new Set(), materials = new Set(), textures = new Set();
      scene.traverse(object => {
        if (object.userData.sharedAsset) return;
        if (object.isInstancedMesh) object.dispose();
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(material);
          for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        }
      });
      geometries.forEach(value => value.dispose());
      materials.forEach(value => value.dispose());
      textures.forEach(value => value.dispose());
      light.shadow.dispose();
      renderer.renderLists.dispose();
      canvas.remove();
    },
  };
}
