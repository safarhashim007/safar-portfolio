import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'

import { artworks } from '../data/artworks'
import { media } from '../data/media'
import { full } from '../lib/image'
import type { DragState } from '../hooks/useCarouselDrag'
import type { Quality } from '../hooks/useDeviceQuality'
import { matCardFragment, matCardVertex } from './shaders/matCard'
import { useTheme } from '../hooks/useTheme'
import {
  buildSlots,
  cardPlacement,
  COMPACT_LAYOUT,
  DESKTOP_LAYOUT,
  MAT_ASPECT,
  MAT_H,
  MAT_W,
  ringFrame,
  ringRadius,
  type RingLayout,
} from './ringGeometry'

/** One full turn a little over a minute — below the threshold where motion
 *  competes with reading, above the threshold where the object looks dead. */
const AMBIENT = 0.085

/* The drum stands on the page's ground, so the haze it recedes into and the
   mat it is framed by have to turn over with the page. Same three roles,
   same relationships, both ways up. */
const GROUNDS = {
  light: {
    ground: new THREE.Color('#e6e4de'),
    mat: new THREE.Color('#efede7'),
    edge: new THREE.Color('#b9b7ac'),
  },
  dark: {
    ground: new THREE.Color('#16171a'),
    mat: new THREE.Color('#23242a'),
    edge: new THREE.Color('#3a3b43'),
  },
} as const


interface RingProps {
  progress: RefObject<number>
  drag: RefObject<DragState>
  layout: RingLayout
  paused: boolean
  reduced: boolean
  onFocus: (artIndex: number) => void
  /** An artwork index to bring to the front, or null. Cleared once it lands. */
  request: RefObject<number | null>
}

function Ring({
  progress,
  drag,
  layout,
  paused,
  reduced,
  onFocus,
  request,
}: RingProps) {
  const group = useRef<THREE.Group>(null)
  const slots = useMemo(() => buildSlots(layout, artworks.length), [layout])
  const urls = useMemo(() => artworks.map((art) => full('art', art.id)), [])
  const textures = useTexture(urls)
  const auto = useRef(0)
  const focused = useRef(-1)

  const radius = useMemo(() => ringRadius(layout), [layout])

  const [theme] = useTheme()
  const tones = GROUNDS[theme]

  const materials = useMemo(() => {
    const list = Array.isArray(textures) ? textures : [textures]
    list.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.generateMipmaps = true
      texture.minFilter = THREE.LinearMipmapLinearFilter
    })

    return slots.map((slot) => {
      const entry = media.art[artworks[slot.art].id]
      return new THREE.ShaderMaterial({
        vertexShader: matCardVertex,
        fragmentShader: matCardFragment,
        uniforms: {
          uMap: { value: list[slot.art] },
          uImageAspect: { value: entry ? entry.w / entry.h : 0.75 },
          uMatAspect: { value: MAT_ASPECT },
          uDepth: { value: 1 },
          uMat: { value: tones.mat },
          uGround: { value: tones.ground },
          uEdge: { value: tones.edge },
          uBend: { value: 0.32 },
        },
      })
    })
    // The shader sources are dependencies on purpose. Without them, editing a
    // shader does nothing until a full reload: Fast Refresh re-renders this
    // component, the memo does not recompute, and the materials keep the
    // sources they were built with — so the old program stays on the GPU.
  }, [slots, textures, tones, matCardVertex, matCardFragment])

  // Materials are created outside React's ownership, so they are disposed here.
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials])

  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta)
    const p = progress.current ?? 0
    const d = drag.current
    if (!d || !group.current) return

    // ---- rotation ----------------------------------------------------
    if (reduced) {
      auto.current = 0
      d.offset = 0
      d.spin = 0
    } else if (!d.dragging) {
      d.spin *= Math.exp(-dt * 2.4)
      d.offset += d.spin * dt
      if (!paused) auto.current += dt * AMBIENT
    }
    // ---- a requested card turns to the front -------------------------
    const wanted = request.current
    if (wanted !== null && wanted >= 0 && !d.dragging) {
      const slot = slots.find((candidate) => candidate.art === wanted)
      if (!slot) {
        request.current = null
      } else {
        const TAU = Math.PI * 2
        const current = slot.angle + auto.current + d.offset
        // shortest way round to facing the viewer
        const delta = -(((current + Math.PI) % TAU + TAU) % TAU - Math.PI)
        if (Math.abs(delta) < 0.008) {
          request.current = null
        } else {
          d.offset += delta * (1 - Math.exp(-dt * 6))
          d.spin = 0
        }
      }
    }

    const theta = auto.current + d.offset

    // ---- the sequence ------------------------------------------------
    const frame = ringFrame(reduced ? 1 : p, layout)
    group.current.scale.setScalar(frame.scale)
    group.current.position.x = frame.x
    group.current.position.y = frame.y
    group.current.rotation.x = frame.rotationX

    // ---- cards -------------------------------------------------------
    let bestDepth = -2
    let bestArt = focused.current
    const children = group.current.children

    for (let i = 0; i < slots.length; i += 1) {
      const mesh = children[i] as THREE.Mesh | undefined
      if (!mesh) continue

      const card = cardPlacement(slots[i], theta, frame, layout, radius)
      mesh.position.set(card.x, card.y, card.z)
      mesh.rotation.y = card.rotationY
      materials[i].uniforms.uDepth.value = card.depth

      // Back-facing cards are skipped outright rather than drawn and discarded.
      mesh.visible = card.z > -0.15 * radius

      if (card.depth > bestDepth) {
        bestDepth = card.depth
        bestArt = slots[i].art
      }
    }

    if (bestArt !== focused.current) {
      focused.current = bestArt
      onFocus(bestArt)
    }
  })

  return (
    <group ref={group}>
      {slots.map((slot, index) => (
        <mesh key={`${slot.row}-${index}`} material={materials[index]}>
          <planeGeometry args={[MAT_W * layout.matScale, MAT_H * layout.matScale, 10, 1]} />
        </mesh>
      ))}
    </group>
  )
}

interface Props {
  progress: RefObject<number>
  drag: RefObject<DragState>
  quality: Quality
  paused: boolean
  onFocus: (artIndex: number) => void
  request: RefObject<number | null>
  /** false while the hero is off-screen: the renderer stops completely. */
  active: boolean
}

export default function ArchiveRing({
  progress,
  drag,
  quality,
  paused,
  onFocus,
  request,
  active,
}: Props) {
  const layout = quality.low ? COMPACT_LAYOUT : DESKTOP_LAYOUT

  return (
    <Canvas
      className="ring-canvas"
      dpr={quality.dpr}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 32, position: [0, 0, 6], near: 0.5, far: 24 }}
      gl={{
        antialias: !quality.low,
        alpha: true,
        powerPreference: quality.low ? 'default' : 'high-performance',
      }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
    >
      <Suspense fallback={null}>
        <Ring
          progress={progress}
          drag={drag}
          layout={layout}
          paused={paused}
          reduced={quality.reduced}
          onFocus={onFocus}
          request={request}
        />
      </Suspense>
    </Canvas>
  )
}
