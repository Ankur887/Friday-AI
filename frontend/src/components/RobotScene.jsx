import { Suspense, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { motion } from 'framer-motion'
import Robot from './Robot'

export default function RobotScene({ isThinking, isReacting, onHoverChange }) {
  const cursorRef = useRef({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handlePointerMove = useCallback((e) => {
    cursorRef.current = {
      x:  (e.clientX / window.innerWidth)  * 2 - 1,
      y: -((e.clientY / window.innerHeight) * 2 - 1),
    }
  }, [])

  const handleEnter = useCallback(() => { setIsHovered(true);  onHoverChange?.(true)  }, [onHoverChange])
  const handleLeave = useCallback(() => { setIsHovered(false); onHoverChange?.(false) }, [onHoverChange])

  return (
    <motion.div
      className="w-full h-full relative"
      onPointerMove={handlePointerMove}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      style={{ cursor: isHovered ? 'pointer' : 'default' }}
    >
      {/* Soft radial glow behind robot */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 65% at 50% 52%, rgba(180,220,240,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Status badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none"
        style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.7)',
          borderRadius: 30,
          padding: '5px 14px',
        }}
      >
        <div
          className="pulse-dot"
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isThinking ? '#FF8C00' : '#00BCD4',
            boxShadow: isThinking ? '0 0 6px #FF8C00' : '0 0 6px #00BCD4',
          }}
        />
        <span style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: 11, letterSpacing: '0.14em', fontWeight: 500,
          color: isThinking ? '#c96800' : '#007a8a',
        }}>
          {isThinking ? 'THINKING…' : isReacting ? 'RESPONDING' : 'Friday · ONLINE'}
        </span>
      </motion.div>

      <Canvas
        camera={{ position: [0, 0.12, 4.4], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        shadows
        style={{ background: 'transparent' }}
      >
        {/* Studio lighting for clean white robot */}
        <ambientLight intensity={0.6} color="#d8eeff" />

        {/* Key light – upper left */}
        <directionalLight
          position={[-3, 5, 4]} intensity={1.8} color="#ffffff"
          castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        />
        {/* Fill light – right */}
        <directionalLight position={[4, 1, 2]} intensity={0.7} color="#e8f4ff" />
        {/* Rim light – back */}
        <directionalLight position={[0, -2, -3]} intensity={0.4} color="#b0d4f0" />
        {/* Teal accent light from front */}
        <pointLight position={[0, 0.5, 3]} color="#00BCD4" intensity={0.5} distance={5} />

        <Suspense fallback={null}>
          <group
            onPointerEnter={handleEnter}
            onPointerLeave={handleLeave}
          >
            <Robot
              cursorRef={cursorRef}
              isThinking={isThinking}
              isReacting={isReacting}
              isHovered={isHovered}
            />
          </group>

          <ContactShadows
            position={[0, -1.55, 0]}
            opacity={0.18}
            scale={4}
            blur={2.8}
            far={2.5}
            color="#80aac8"
          />

          <Environment preset="studio" />
        </Suspense>
      </Canvas>

      {/* Hover label */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,188,212,0.3)',
            borderRadius: 24, padding: '5px 16px',
            fontFamily: 'Outfit, sans-serif', fontSize: 11,
            letterSpacing: '0.16em', fontWeight: 500,
            color: '#007a8a', pointerEvents: 'none', whiteSpace: 'nowrap',
          }}
        >
          ◉ CLICK ME
        </motion.div>
      )}
    </motion.div>
  )
}