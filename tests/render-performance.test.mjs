import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/vendor/three.module.js';
import { createFrameLoop, advanceMotion } from '../public/render-loop.js';
import { batchStaticMeshes } from '../public/scene-batching.js';

function fakeFrames() {
  let id = 0;
  const pending = new Map();
  return {
    requestFrame(callback) { pending.set(++id, callback); return id; },
    cancelFrame(id) { pending.delete(id); },
    tick(time) { const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(callback => callback(time)); },
    get size() { return pending.size; },
  };
}

test('idle scenes coalesce input, stop drawing and restart only on invalidation', () => {
  const frames = fakeFrames(); let draws = 0;
  const loop = createFrameLoop(() => { draws++; return false; }, frames);
  for (let i = 0; i < 20; i++) loop.invalidate();
  assert.equal(frames.size, 1);
  frames.tick(16);
  assert.equal(draws, 1); assert.equal(frames.size, 0);
  frames.tick(1000); assert.equal(draws, 1);
  loop.invalidate(); frames.tick(1016); assert.equal(draws, 2);
  loop.dispose(); loop.invalidate(); assert.equal(frames.size, 0);
});

test('continuous animations stop offscreen and disposal cancels pending work', () => {
  const frames = fakeFrames(); let draws = 0;
  const loop = createFrameLoop(() => { draws++; return true; }, frames);
  loop.invalidate(); frames.tick(16); assert.equal(frames.size, 1);
  loop.setVisible(false); assert.equal(frames.size, 0);
  loop.invalidate(); frames.tick(32); assert.equal(draws, 1);
  loop.setVisible(true); frames.tick(48); assert.equal(draws, 2);
  loop.dispose(); frames.tick(64); assert.equal(draws, 2);
});

test('60 Hz and 144 Hz monitors have the same travel time, including reversal', () => {
  const simulate = hz => {
    let value = 0;
    for (let i = 0; i < hz; i++) value = advanceMotion(value, 1, 1 / hz);
    const open = value;
    for (let i = 0; i < hz; i++) value = advanceMotion(value, 0, 1 / hz);
    return [open, value];
  };
  const slow = simulate(60), fast = simulate(144);
  slow.forEach((value,i) => assert.ok(Math.abs(value - fast[i]) < 1e-12));
  let value = 0;
  for (let i = 0; i < 600; i++) value = advanceMotion(value, 1, 1 / 60);
  assert.equal(value, 1);
});

function surface(root) {
  root.updateMatrixWorld(true);
  const triangles = [];
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.attributes.position, index = mesh.geometry.index;
    const length = index ? index.count : positions.count;
    for (let i = 0; i < length; i += 3) {
      const corners = [];
      for (let j = 0; j < 3; j++) {
        const v = new T.Vector3().fromBufferAttribute(positions, index ? index.getX(i+j) : i+j).applyMatrix4(mesh.matrixWorld);
        corners.push(v.toArray().map(n => n.toFixed(4)).join(','));
      }
      triangles.push(corners.join('|'));
    }
  });
  return triangles.sort();
}

test('batching preserves every triangle, local transforms, normals and shadows', () => {
  const root = new T.Group(); root.position.set(2, 1, -3);
  for (let i = 0; i < 100; i++) {
    const mesh = new T.Mesh(new T.BoxGeometry(.525,.027,.655), new T.MeshStandardMaterial({ color: 0x9da59c, roughness: .6 }));
    mesh.position.set((i % 10) * .55,.104,Math.floor(i / 10) * .68);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
  }
  const before = surface(root);
  assert.equal(batchStaticMeshes(root), 99);
  assert.equal(root.children.length, 1);
  assert.deepEqual(surface(root), before);
  assert.equal(root.children[0].castShadow, true);
  assert.equal(root.children[0].receiveShadow, true);
  assert.equal(root.children[0].geometry.attributes.normal.count, 3600);
});

test('animated meshes, imported models and transparent parts stay independent', () => {
  const root = new T.Group();
  const meshes = Array.from({ length: 5 }, () => new T.Mesh(new T.BoxGeometry(), new T.MeshStandardMaterial()));
  meshes[1].userData.sharedAsset = true;
  meshes[2].material.transparent = true;
  meshes.forEach(mesh => root.add(mesh));
  assert.equal(batchStaticMeshes(root, new Set([meshes[0]])), 1);
  for (const mesh of meshes.slice(0,3)) assert.equal(mesh.parent, root);
  meshes[0].rotation.y = 1;
  assert.equal(meshes[0].rotation.y, 1);
});
