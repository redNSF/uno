import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 300

export function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Initial particle state
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        0.1,
        (Math.random() - 0.5) * 0.4,
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 8 + 4,
        (Math.random() - 0.5) * 5,
      ),
      color: new THREE.Color().setHSL(Math.random(), 0.9, 0.6),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 6,
      life: 1.0,
      lifeSpeed: 0.3 + Math.random() * 0.4,
    }))
  }, [])

  const colors = useMemo(() => {
    const c = new Float32Array(PARTICLE_COUNT * 3)
    particles.forEach((p, i) => {
      c[i * 3] = p.color.r
      c[i * 3 + 1] = p.color.g
      c[i * 3 + 2] = p.color.b
    })
    return c
  }, [particles])

  useFrame((_, delta) => {
    if (!meshRef.current) return

    particles.forEach((p, i) => {
      p.life = Math.max(0, p.life - delta * p.lifeSpeed)
      if (p.life <= 0) {
        // Respawn
        p.position.set((Math.random() - 0.5) * 0.4, 0.1, (Math.random() - 0.5) * 0.4)
        p.velocity.set(
          (Math.random() - 0.5) * 5,
          Math.random() * 8 + 4,
          (Math.random() - 0.5) * 5,
        )
        p.life = 1.0
      }

      // Physics
      p.velocity.y -= 9.8 * delta
      p.position.addScaledVector(p.velocity, delta)
      p.rotation += p.rotSpeed * delta

      dummy.position.copy(p.position)
      dummy.rotation.set(p.rotation, p.rotation * 0.6, 0)
      dummy.scale.setScalar(0.06 * p.life)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial vertexColors transparent depthWrite={false} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}
