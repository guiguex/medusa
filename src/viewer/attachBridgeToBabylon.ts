// src/viewer/attachBridgeToBabylon.ts
import { viewerBridge } from './bridge'
import type { Scene, AbstractMesh, ArcRotateCamera } from '@babylonjs/core'

type AttachOpts = {
  deriveMetaUrl?: (glbUrl: string) => string
  optInPrefix?: string
  optOutPrefix?: string
}
const DEF: Required<AttachOpts> = {
  deriveMetaUrl: glb => glb.replace(/\.glb($|\?)/i, '_meta.json$1'),
  optInPrefix: 'Optin_',
  optOutPrefix: 'Optout_'
}

export function attachBridgeToBabylon(
  scene: Scene,
  camera: ArcRotateCamera,
  getGlbUrl: () => string | undefined,
  opts: AttachOpts = {}
) {
  const O = { ...DEF, ...opts }
  let highlighted: AbstractMesh[] = []
  const originalMats = new Map<AbstractMesh, any>()

  const meshes = () => scene.meshes.filter(Boolean) as AbstractMesh[]

  const findByCode = (code: string) => {
    const k = code.toLowerCase()
    return meshes().filter(m => (m.name || '').toLowerCase().includes(k))
  }

  const clearHL = () => {
    highlighted.forEach(m => { if (originalMats.has(m)) m.material = originalMats.get(m) })
    highlighted = []; originalMats.clear()
  }

  const highlight = (code: string) => {
    clearHL()
    const targets = findByCode(code)
    targets.forEach(m => {
      originalMats.set(m, m.material)
      if (m.material?.clone) {
        const mat = m.material.clone(`${m.name}_HL`)
        // @ts-ignore
        if (mat.emissiveColor) mat.emissiveColor.set(1, 0, 0)
        m.material = mat
      }
    })
    highlighted = targets
  }

  const cameraTo = (code: string) => {
    const targets = findByCode(code)
    if (!targets.length) return
    let min = { x: +Infinity, y: +Infinity, z: +Infinity }
    let max = { x: -Infinity, y: -Infinity, z: -Infinity }
    targets.forEach(m => {
      const b = m.getBoundingInfo()?.boundingBox; if (!b) return
      const mi = b.minimumWorld, ma = b.maximumWorld
      min = { x: Math.min(min.x, mi.x), y: Math.min(min.y, mi.y), z: Math.min(min.z, mi.z) }
      max = { x: Math.max(max.x, ma.x), y: Math.max(max.y, ma.y), z: Math.max(max.z, ma.z) }
    })
    const center = { x: (min.x+max.x)/2, y: (min.y+max.y)/2, z: (min.z+max.z)/2 }
    const radius = Math.max(max.x-min.x, max.y-min.y, max.z-min.z) * 2.2 || camera.radius
    camera.setTarget(center as any); camera.radius = radius
  }

  const loadMeta = async (glb?: string, metaExplicit?: string) => {
    const url = metaExplicit || (glb ? O.deriveMetaUrl(glb) : undefined)
    if (!url) return
    try { await fetch(url, { cache: 'no-store' }).then(r => r.json()) } catch {}
  }

  const off = viewerBridge.on(async e => {
    if (e.type === 'select-part') highlight(e.code)
    if (e.type === 'select-option') highlight(e.code)
    if (e.type === 'camera-to') cameraTo(e.code)
    if (e.type === 'load') { await loadMeta(e.glbUrl, e.metaUrl); clearHL() }
  })

  // auto meta load
  loadMeta(getGlbUrl())

  return () => off()
}
