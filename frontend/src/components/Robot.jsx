import { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── Cute Round Head ──────────────────────────────────────────────────────────
function RobotHead({ cursorRef, isThinking, isReacting, laughPhase, poseType }) {
  const headRef = useRef()
  const eyeLRef = useRef()
  const eyeRRef = useRef()
  const blinkT = useRef(Math.random() * 3 + 2)
  const blinking = useRef(false)
  const blinkProg = useRef(0)

  useFrame((state) => {
    if (!headRef.current) return
    const t = state.clock.elapsedTime

    // ── cursor follow (suppressed while laughing for head-shake poses) ──
    const { x, y } = cursorRef.current
    const max = 0.28, s = 0.055

    if (laughPhase > 0) {
      // Laughing head motion overrides cursor follow
      if (poseType === 'shake') {
        headRef.current.rotation.y = Math.sin(t * 16) * 0.22
        headRef.current.rotation.z = Math.sin(t * 11) * 0.12
        headRef.current.rotation.x = -0.05 + Math.sin(t * 14) * 0.05
      } else if (poseType === 'tilt') {
        headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.3, 0.12)
        headRef.current.rotation.x = -0.12 + Math.sin(t * 9) * 0.04
        headRef.current.rotation.y = Math.sin(t * 5) * 0.06
      } else if (poseType === 'bounce') {
        headRef.current.rotation.x = -0.08 + Math.sin(t * 10) * 0.07
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.1)
        headRef.current.rotation.z = Math.sin(t * 6) * 0.04
      } else {
        // spin pose: keep head level relative to body spin
        headRef.current.rotation.x = -0.06
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.1)
        headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.1)
      }
    } else {
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y, THREE.MathUtils.clamp(x * max, -max, max), s)
      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x, THREE.MathUtils.clamp(-y * 0.18, -0.18, 0.18), s)
      headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.1)
    }

    // ── blink timer (paused while laughing — eyes do happy-squint instead) ──
    if (laughPhase > 0) {
      const squint = 0.25 + Math.sin(t * 12) * 0.08
      if (eyeLRef.current) eyeLRef.current.scale.y = THREE.MathUtils.lerp(eyeLRef.current.scale.y, squint, 0.25)
      if (eyeRRef.current) eyeRRef.current.scale.y = THREE.MathUtils.lerp(eyeRRef.current.scale.y, squint, 0.25)
      return
    }

    blinkT.current -= 0.016
    if (blinkT.current <= 0 && !blinking.current) {
      blinking.current = true
      blinkProg.current = 0
      blinkT.current = Math.random() * 4 + 2.5
    }
    if (blinking.current) {
      blinkProg.current += 0.14
      const sc = blinkProg.current < Math.PI
        ? Math.max(0.05, Math.abs(Math.cos(blinkProg.current)))
        : 1
      if (eyeLRef.current) eyeLRef.current.scale.y = sc
      if (eyeRRef.current) eyeRRef.current.scale.y = sc
      if (blinkProg.current >= Math.PI) {
        blinking.current = false
        if (eyeLRef.current) eyeLRef.current.scale.y = 1
        if (eyeRRef.current) eyeRRef.current.scale.y = 1
      }
    } else {
      if (eyeLRef.current) eyeLRef.current.scale.y = THREE.MathUtils.lerp(eyeLRef.current.scale.y, 1, 0.2)
      if (eyeRRef.current) eyeRRef.current.scale.y = THREE.MathUtils.lerp(eyeRRef.current.scale.y, 1, 0.2)
    }
  })

  const teal = '#00BCD4'

  return (
    <group ref={headRef} position={[0, 0.58, 0]}>

      {/* ── Main head sphere ── */}
      <mesh castShadow>
        <sphereGeometry args={[0.52, 48, 48]} />
        <meshStandardMaterial
          color="#FFFFFF" roughness={0.08} metalness={0.06}
          envMapIntensity={0.9}
        />
      </mesh>

      {/* ── Left eye ── */}
      <group ref={eyeLRef} position={[-0.16, 0.06, 0.51]}>
        <mesh scale={[1.15, 0.7, 0.25]}>
          <sphereGeometry args={[0.125, 32, 32]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.1} metalness={0.1} />
        </mesh>
        <mesh position={[0.025, 0.03, 0.11]} scale={[0.45, 0.38, 0.3]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* ── Right eye ── */}
      <group ref={eyeRRef} position={[0.16, 0.06, 0.51]}>
        <mesh scale={[1.15, 0.7, 0.25]}>
          <sphereGeometry args={[0.125, 32, 32]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.1} metalness={0.1} />
        </mesh>
        <mesh position={[0.025, 0.03, 0.11]} scale={[0.45, 0.38, 0.3]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* ── Happy laugh cheeks (visible only while laughing) ── */}
      {laughPhase > 0 && (
        <>
          <mesh position={[-0.27, -0.06, 0.43]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#FFB6C1" transparent opacity={0.55 * laughPhase} roughness={0.4} />
          </mesh>
          <mesh position={[0.27, -0.06, 0.43]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#FFB6C1" transparent opacity={0.55 * laughPhase} roughness={0.4} />
          </mesh>
        </>
      )}

      {/* ── Thinking / reacting pupil glow ── */}
      {(isThinking || isReacting) && laughPhase === 0 && (
        <>
          <mesh position={[-0.155, 0.06, 0.52]}>
            <circleGeometry args={[0.06, 24]} />
            <meshStandardMaterial
              color={isThinking ? '#FF8C00' : teal}
              emissive={isThinking ? '#FF8C00' : teal}
              emissiveIntensity={isThinking ? 2.5 : 3}
              transparent opacity={0.85}
            />
          </mesh>
          <mesh position={[0.155, 0.06, 0.52]}>
            <circleGeometry args={[0.06, 24]} />
            <meshStandardMaterial
              color={isThinking ? '#FF8C00' : teal}
              emissive={isThinking ? '#FF8C00' : teal}
              emissiveIntensity={isThinking ? 2.5 : 3}
              transparent opacity={0.85}
            />
          </mesh>
        </>
      )}

      {/* ── Left antenna ── */}
      <group position={[-0.18, 0.5, 0]} rotation={[0, 0, -0.2]}>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.018, 0.014, 0.34, 12]} />
          <meshStandardMaterial color={teal} roughness={0.25} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <sphereGeometry args={[0.044, 16, 16]} />
          <meshStandardMaterial color={teal} roughness={0.15} metalness={0.4}
            emissive={teal} emissiveIntensity={isReacting || laughPhase > 0 ? 2 : 0.4} />
        </mesh>
      </group>

      {/* ── Right antenna ── */}
      <group position={[0.18, 0.5, 0]} rotation={[0, 0, 0.2]}>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.018, 0.014, 0.34, 12]} />
          <meshStandardMaterial color={teal} roughness={0.25} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <sphereGeometry args={[0.044, 16, 16]} />
          <meshStandardMaterial color={teal} roughness={0.15} metalness={0.4}
            emissive={teal} emissiveIntensity={isReacting || laughPhase > 0 ? 2 : 0.4} />
        </mesh>
      </group>

      {/* ── Left ear ── */}
      <group position={[-0.53, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.06, 0.14, 20]} />
          <meshStandardMaterial color={teal} roughness={0.3} metalness={0.4} />
        </mesh>
      </group>

      {/* ── Right ear ── */}
      <group position={[0.53, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.06, 0.14, 20]} />
          <meshStandardMaterial color={teal} roughness={0.3} metalness={0.4} />
        </mesh>
      </group>

    </group>
  )
}

// ── Round Body ───────────────────────────────────────────────────────────────
function RobotBody({ isThinking, isReacting, laughPhase }) {
  const bodyRef = useRef()
  const innerGlowRef = useRef()
  const mouthRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // breathing — bigger "giggle bounce" while laughing
    if (bodyRef.current) {
      const breathe = laughPhase > 0
        ? 1 + Math.abs(Math.sin(t * 9)) * 0.06 * laughPhase
        : 1 + Math.sin(t * 1.1) * 0.015
      bodyRef.current.scale.set(breathe, breathe * (laughPhase > 0 ? 0.97 : 1), breathe)
    }
    // inner glow pulse — pink/warm while laughing
    if (innerGlowRef.current) {
      innerGlowRef.current.material.emissiveIntensity =
        laughPhase > 0 ? 1.5 + Math.sin(t * 10) * 0.8
          : isThinking ? 1.2 + Math.sin(t * 5) * 0.6
            : isReacting ? 2.5 + Math.sin(t * 8) * 1
              : 0.15 + Math.sin(t * 1.2) * 0.08
    }
    // mouth widens into a big laugh smile
    if (mouthRef.current) {
      const target = laughPhase > 0 ? 1.6 : 1
      mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, target, 0.15)
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, target * 1.3, 0.15)
    }
  })

  const teal = '#00BCD4'
  const mouthColor = laughPhase > 0 ? '#FF8FA3' : teal

  return (
    <group position={[0, -0.28, 0]}>
      <group ref={bodyRef}>
        {/* Main body sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.62, 48, 48]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.1} metalness={0.05} envMapIntensity={0.8} />
        </mesh>

        {/* Smile arc — widens into laugh */}
        <mesh ref={mouthRef} position={[0, -0.08, 0.58]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.11, 0.018, 8, 32, Math.PI]} />
          <meshStandardMaterial color={mouthColor} roughness={0.2} metalness={0.5}
            emissive={mouthColor} emissiveIntensity={laughPhase > 0 ? 1.1 : 0.5} />
        </mesh>

        {/* Inner glow circle */}
        <mesh ref={innerGlowRef} position={[0, 0.1, 0.595]}>
          <circleGeometry args={[0.1, 32]} />
          <meshStandardMaterial color={laughPhase > 0 ? '#FFB6C1' : teal}
            emissive={laughPhase > 0 ? '#FFB6C1' : teal} emissiveIntensity={0.15}
            transparent opacity={0.9} />
        </mesh>

        {/* Bottom neck join */}
        <mesh position={[0, 0.58, 0]}>
          <cylinderGeometry args={[0.19, 0.22, 0.14, 24]} />
          <meshStandardMaterial color="#F0F2F5" roughness={0.12} metalness={0.05} />
        </mesh>
      </group>
    </group>
  )
}

// ── Arm Stubs ────────────────────────────────────────────────────────────────
function RobotArm({ side, isReacting, laughPhase, poseType }) {
  const armRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!armRef.current) return

    if (laughPhase > 0) {
      if (poseType === 'wave' || poseType === 'bounce') {
        // both arms wave up and down like a happy giggle
        armRef.current.rotation.z = side * (-0.5 + Math.sin(t * 10 + (side > 0 ? 0 : 1)) * 0.45)
      } else if (poseType === 'spin') {
        armRef.current.rotation.z = side * (-0.65 + Math.sin(t * 8) * 0.2)
      } else {
        // shake / tilt: gentle happy wobble
        armRef.current.rotation.z = side * (-0.3 + Math.sin(t * 7 + side) * 0.25)
      }
      return
    }

    const sway = Math.sin(t * 0.9 + (side < 0 ? 0 : Math.PI)) * 0.04
    armRef.current.rotation.z = side * sway

    if (isReacting && side > 0) {
      armRef.current.rotation.z = -0.35 + Math.sin(t * 7) * 0.28
    }
  })

  return (
    <group ref={armRef} position={[side * 0.7, -0.22, 0]}>
      <mesh position={[0, -0.12, 0]} castShadow>
        <sphereGeometry args={[0.15, 24, 24]} />
        <meshStandardMaterial color="#F0F2F5" roughness={0.12} metalness={0.05} />
      </mesh>
      <mesh position={[side * 0.06, -0.3, 0.04]} castShadow>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial color="#F5F6F8" roughness={0.12} metalness={0.05} />
      </mesh>
    </group>
  )
}

// ── Floating "haha" sparkle particles (laugh burst) ──────────────────────────
function LaughSparkles({ laughPhase }) {
  const groupRef = useRef()
  const seeds = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * Math.PI * 2,
    speed: 0.6 + Math.random() * 0.5,
    radius: 0.9 + Math.random() * 0.4,
    yOff: Math.random() * 0.4,
  })), [])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.visible = laughPhase > 0
    if (laughPhase <= 0) return
    const t = state.clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      const s = seeds[i]
      const localT = (t * s.speed + i) % 2
      child.position.x = Math.cos(s.angle) * s.radius
      child.position.z = Math.sin(s.angle) * s.radius
      child.position.y = 0.5 + s.yOff + localT * 0.5
      child.material.opacity = laughPhase * Math.max(0, 1 - localT / 2)
      child.scale.setScalar(0.6 + Math.sin(localT * Math.PI) * 0.4)
    })
  })

  return (
    <group ref={groupRef} visible={false}>
      {seeds.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#FFD93D" emissive="#FFD93D" emissiveIntensity={2}
            transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}

// ── Ambient floating dust specks ─────────────────────────────────────────────
function FloatParticles() {
  const ref = useRef()
  const count = 55
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 7
      arr[i * 3 + 1] = (Math.random() - 0.5) * 7
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3
    }
    return arr
  }, [])

  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.018
      ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.01) * 0.06
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color="#00BCD4" transparent opacity={0.35} sizeAttenuation />
    </points>
  )
}

// ── Holographic ground ring ───────────────────────────────────────────────────
function GroundRing({ laughPhase }) {
  const r1 = useRef(), r2 = useRef()
  useFrame((s) => {
    const t = s.clock.elapsedTime
    const speedMul = laughPhase > 0 ? 2.4 : 1
    if (r1.current) r1.current.rotation.y = t * 0.4 * speedMul
    if (r2.current) r2.current.rotation.y = -t * 0.28 * speedMul
  })

  return (
    <group position={[0, -1.4, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 64]} />
        <meshStandardMaterial color="#00BCD4" emissive="#00BCD4" emissiveIntensity={0.08}
          transparent opacity={0.12} />
      </mesh>
      <mesh ref={r1} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.012, 8, 64]} />
        <meshStandardMaterial color="#00BCD4" emissive="#00BCD4" emissiveIntensity={1}
          transparent opacity={0.7} />
      </mesh>
      <mesh ref={r2} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.95, 0.007, 8, 64]} />
        <meshStandardMaterial color="#4DD0E1" emissive="#4DD0E1" emissiveIntensity={0.7}
          transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// ── Pose definitions ──────────────────────────────────────────────────────────
const POSE_TYPES = ['bounce', 'spin', 'shake', 'tilt', 'wave']
const LAUGH_DURATION = 1.8 // seconds

// ── Full Robot ────────────────────────────────────────────────────────────────
export default function Robot({ cursorRef, isThinking, isReacting, isHovered }) {
  const groupRef = useRef()
  const [laughPhase, setLaughPhase] = useState(0) // 0 = idle, 1 = full laugh, fades to 0
  const [poseType, setPoseType] = useState('bounce')
  const laughStartRef = useRef(0)
  const isLaughingRef = useRef(false)

  const triggerLaugh = useCallback((e) => {
    e?.stopPropagation?.()
    const next = POSE_TYPES[Math.floor(Math.random() * POSE_TYPES.length)]
    setPoseType(next)
    setLaughPhase(1)
    isLaughingRef.current = true
    laughStartRef.current = performance.now() / 1000
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // ── Laugh phase decay ──
    if (isLaughingRef.current) {
      const elapsed = performance.now() / 1000 - laughStartRef.current
      if (elapsed > LAUGH_DURATION) {
        isLaughingRef.current = false
        setLaughPhase(0)
      } else if (elapsed > LAUGH_DURATION * 0.7) {
        // fade out tail
        const fade = 1 - (elapsed - LAUGH_DURATION * 0.7) / (LAUGH_DURATION * 0.3)
        setLaughPhase(Math.max(0, fade))
      }
    }

    const activeLaugh = isLaughingRef.current

    // ── Float ──
    if (!activeLaugh || poseType !== 'bounce') {
      groupRef.current.position.y = Math.sin(t * 0.75) * 0.1
    }

    // ── Pose-specific whole-body motion ──
    if (activeLaugh) {
      if (poseType === 'bounce') {
        groupRef.current.position.y = Math.abs(Math.sin(t * 11)) * 0.22 - 0.05
        groupRef.current.rotation.z = Math.sin(t * 6) * 0.05
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.08)
      } else if (poseType === 'spin') {
        groupRef.current.rotation.y += 0.22
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1)
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1)
      } else if (poseType === 'shake') {
        groupRef.current.rotation.z = Math.sin(t * 13) * 0.08
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1)
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1)
      } else if (poseType === 'tilt') {
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0.22, 0.1)
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.08, 0.1)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.08)
      } else if (poseType === 'wave') {
        groupRef.current.rotation.z = Math.sin(t * 5) * 0.06
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.04, 0.1)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.08)
      }
    } else if (isReacting) {
      groupRef.current.rotation.x = Math.sin(t * 9) * 0.055
    } else {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.06)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.06)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.06)
    }
  })

  return (
    <group ref={groupRef} onClick={triggerLaugh}>
      <FloatParticles />
      <GroundRing laughPhase={laughPhase} />
      <LaughSparkles laughPhase={laughPhase} />
      <RobotHead cursorRef={cursorRef} isThinking={isThinking} isReacting={isReacting}
        laughPhase={laughPhase} poseType={poseType} />
      <RobotBody isThinking={isThinking} isReacting={isReacting} laughPhase={laughPhase} />
      <RobotArm side={-1} isReacting={isReacting} laughPhase={laughPhase} poseType={poseType} />
      <RobotArm side={1} isReacting={isReacting} laughPhase={laughPhase} poseType={poseType} />

      {/* Hover aura rings */}
      {isHovered && [0.65, 0.9, 1.15].map((r, i) => (
        <mesh key={i} position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.01 - i * 0.002, 8, 64]} />
          <meshStandardMaterial color="#00BCD4" emissive="#00BCD4"
            emissiveIntensity={1.8 - i * 0.4} transparent opacity={0.55 - i * 0.12} />
        </mesh>
      ))}
    </group>
  )
}