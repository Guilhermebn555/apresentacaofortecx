"""Convert supplied USDZ meshes to browser-ready GLB, preserving UVs and materials."""
from pathlib import Path
import io, zipfile
import numpy as np
from PIL import Image
from pxr import Usd, UsdGeom, UsdShade
import trimesh

OUT=Path(__file__).resolve().parents[1]/'dist/models'
OUT.mkdir(parents=True,exist_ok=True)

def convert(source, target):
    stage=Usd.Stage.Open(str(source)); archive=zipfile.ZipFile(source)
    scene=trimesh.Scene(); cache=UsdGeom.XformCache(); materials={}
    def material(prim):
        bound,_=UsdShade.MaterialBindingAPI(prim).ComputeBoundMaterial()
        if not bound: return trimesh.visual.material.PBRMaterial(baseColorFactor=[180,180,180,255])
        key=str(bound.GetPath())
        if key in materials:return materials[key]
        shader=bound.ComputeSurfaceSource()[0]
        def value(name,default):
            inp=shader.GetInput(name); val=inp.Get() if inp else None
            return default if val is None else val
        def texture(name):
            inp=shader.GetInput(name)
            if not inp or not inp.HasConnectedSource():return None
            tex=inp.GetConnectedSource()[0]; asset=tex.GetInput('file').Get()
            return Image.open(io.BytesIO(archive.read(asset.path))).copy() if asset else None
        color=np.array(value('diffuseColor',[1,1,1]),dtype=float)
        # USD factors are linear; trimesh serializes color factors from sRGB bytes.
        color=np.where(color<=.0031308,color*12.92,1.055*np.power(color,1/2.4)-.055)
        alpha=float(value('opacity',1))
        m=trimesh.visual.material.PBRMaterial(name=bound.GetPrim().GetName(),baseColorFactor=np.rint(np.r_[color,alpha]*255).clip(0,255).astype(np.uint8),baseColorTexture=texture('diffuseColor'),normalTexture=texture('normal'),roughnessFactor=float(value('roughness',1-float(value('glossiness',.5)))),metallicFactor=float(value('metallic',0)),doubleSided=True,alphaMode='BLEND' if alpha<.99 else 'OPAQUE')
        materials[key]=m;return m
    for prim in stage.Traverse():
        if not prim.IsA(UsdGeom.Mesh):continue
        mesh=UsdGeom.Mesh(prim)
        if UsdGeom.Imageable(prim).ComputeVisibility()=='invisible':continue
        # Exclude only an authored display floor, if present, from component framing.
        if 'floor' in str(prim.GetPath()).lower():continue
        points=np.asarray(mesh.GetPointsAttr().Get(),dtype=float)
        idx=np.asarray(mesh.GetFaceVertexIndicesAttr().Get(),dtype=np.int64)
        counts=np.asarray(mesh.GetFaceVertexCountsAttr().Get(),dtype=np.int64)
        vertices=points[idx]; faces=[]; offset=0
        for count in counts:
            faces.extend((offset,offset+i,offset+i+1) for i in range(1,count-1));offset+=count
        faces=np.asarray(faces)
        if mesh.GetOrientationAttr().Get()=='leftHanded':faces=faces[:,::-1]
        normals=None; raw=mesh.GetNormalsAttr().Get()
        def expand(data,interp):
            arr=np.asarray(data,dtype=float)
            if interp=='faceVarying':return arr
            if interp in ['vertex','varying']:return arr[idx]
            if interp=='uniform':return np.repeat(arr,counts,axis=0)
            if interp=='constant':return np.repeat(arr,len(idx),axis=0)
        if raw is not None and len(raw):normals=expand(raw,mesh.GetNormalsInterpolation())
        uv=None
        for name in ['st0','st','UVMap']:
            pv=UsdGeom.PrimvarsAPI(prim).GetPrimvar(name)
            if pv and pv.HasValue():uv=expand(pv.ComputeFlattened(),pv.GetInterpolation());break
        geom=trimesh.Trimesh(vertices=vertices,faces=faces,vertex_normals=normals,process=False,visual=trimesh.visual.TextureVisuals(uv=uv,material=material(prim)))
        geom.merge_vertices(merge_tex=False,merge_norm=False)
        transform=np.asarray(cache.GetLocalToWorldTransform(prim)).T
        geom.apply_transform(transform)
        scene.add_geometry(geom,node_name=str(prim.GetPath()),geom_name=str(prim.GetPath()))
    if str(UsdGeom.GetStageUpAxis(stage))=='Z':scene.apply_transform(trimesh.transformations.rotation_matrix(-np.pi/2,[1,0,0]))
    bounds=scene.bounds; size=bounds[1]-bounds[0]
    transform=np.eye(4);transform[:3,3]=-(bounds[0]+bounds[1])/2
    scene.apply_transform(transform)
    scene.apply_scale(3.2/max(size))
    # Rest the complete supplied model on the scene's component floor.
    transform=np.eye(4);transform[1,3]=-scene.bounds[0,1]-.35;scene.apply_transform(transform)
    dest=OUT/target;dest.write_bytes(scene.export(file_type='glb'))
    check=trimesh.load(dest,force='scene')
    assert len(check.geometry)==len(scene.geometry)
    assert np.all(np.isfinite(check.bounds))
    print(target,'meshes',len(check.geometry),'triangles',sum(len(g.faces) for g in check.geometry.values()),'bytes',dest.stat().st_size,'bounds',check.bounds.tolist())

if __name__=='__main__':
    convert(Path('C:/Users/Guilh/Downloads/Arduino_Uno_Board.usdz'),'arduino-uno.glb')
    convert(Path('C:/Users/Guilh/Downloads/Servomotor_SG90.usdz'),'servo-sg90.glb')
