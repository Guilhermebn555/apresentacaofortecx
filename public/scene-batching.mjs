import { Mesh } from './vendor/three.module.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';

// Merge only static, opaque siblings. Keep moving groups, textures and supplied
// models intact; bake the same local transforms without simplifying triangles.
export function batchStaticMeshes(root, protectedMeshes = new Set()) {
  const retiredGeometry = new Set();
  const retiredMaterial = new Set();
  let mergedMeshes = 0;
  function visit(parent) {
    for (const child of [...parent.children]) if (!child.isMesh) visit(child);
    const buckets = new Map();
    for (const mesh of parent.children) {
      const material = mesh.material;
      if (!mesh.isMesh || mesh.isInstancedMesh || mesh.isSkinnedMesh || mesh.children.length ||
          mesh.userData.sharedAsset || protectedMeshes.has(mesh) || Array.isArray(material) ||
          material.transparent || material.map || material.normalMap || !mesh.visible ||
          mesh.morphTargetInfluences) continue;
      const settings = material.toJSON();
      delete settings.uuid;
      delete settings.metadata;
      const attributes = Object.entries(mesh.geometry.attributes).map(([name,a]) => [name,a.itemSize,a.normalized]).sort();
      const key = JSON.stringify([settings, attributes, mesh.castShadow, mesh.receiveShadow, mesh.renderOrder, mesh.layers.mask]);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(mesh);
    }
    for (const meshes of buckets.values()) {
      if (meshes.length < 2) continue;
      const parts = meshes.map(mesh => {
        mesh.updateMatrix();
        const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        return geometry.applyMatrix4(mesh.matrix);
      });
      const geometry = mergeGeometries(parts, false);
      parts.forEach(part => part.dispose());
      if (!geometry) continue;
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      const first = meshes[0];
      const merged = new Mesh(geometry, first.material);
      merged.castShadow = first.castShadow;
      merged.receiveShadow = first.receiveShadow;
      merged.renderOrder = first.renderOrder;
      merged.layers.mask = first.layers.mask;
      merged.name = 'static-batch';
      for (const mesh of meshes) {
        parent.remove(mesh);
        retiredGeometry.add(mesh.geometry);
        retiredMaterial.add(mesh.material);
      }
      parent.add(merged);
      mergedMeshes += meshes.length - 1;
    }
  }
  visit(root);
  root.traverse(mesh => {
    retiredGeometry.delete(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) retiredMaterial.delete(material);
  });
  retiredGeometry.forEach(geometry => geometry.dispose());
  retiredMaterial.forEach(material => material.dispose());
  return mergedMeshes;
}
