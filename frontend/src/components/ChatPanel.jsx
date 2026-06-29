import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefs } from '../Auth/PrefsContext'
import MarkdownRenderer from './MarkdownRenderer'

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: { hello: "Hello! I'm Friday.", sub: "Your futuristic AI companion. Ask me anything to get started." },
  hi: { hello: "नमस्ते! मैं Friday हूँ।", sub: "आपका भविष्यवादी AI साथी। शुरू करने के लिए कुछ भी पूछें।" },
  es: { hello: "¡Hola! Soy Friday.", sub: "Tu compañero de IA futurista. Pregúntame lo que quieras." },
  fr: { hello: "Bonjour! Je suis Friday.", sub: "Votre compagnon IA futuriste. Posez-moi n'importe quelle question." },
  de: { hello: "Hallo! Ich bin Friday.", sub: "Dein futuristischer KI-Begleiter. Frag mich alles, um loszulegen." },
}

const RobotIcon = () => (
  <div style={{
    width: 30, height: 30, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
    border: '1px solid rgba(0,188,212,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="4" stroke="#00BCD4" strokeWidth="1.6"/>
      <rect x="6" y="15" width="12" height="7" rx="2" stroke="#00BCD4" strokeWidth="1.6"/>
      <circle cx="9.5" cy="17.5" r="0.9" fill="#00BCD4"/>
      <circle cx="14.5" cy="17.5" r="0.9" fill="#00BCD4"/>
    </svg>
  </div>
)

const UserIcon = () => (
  <div style={{
    width: 30, height: 30, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, rgba(0,188,212,0.2), rgba(0,150,200,0.15))',
    border: '1px solid rgba(0,188,212,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 600, color: '#007a8a',
    fontFamily: 'Outfit, sans-serif',
  }}>
    U
  </div>
)

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}
    >
      <RobotIcon />
      <div style={{
        padding: '10px 14px',
        background: 'rgba(235,240,250,0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(200,215,235,0.7)',
        borderRadius: '18px 18px 18px 4px',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </motion.div>
  )
}

function Message({ msg, showTimestamp, compact, fontSize }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: compact ? 6 : 12,
      }}
    >
      {isUser ? <UserIcon /> : <RobotIcon />}
      <div style={{
        maxWidth: '74%',
        padding: compact ? '7px 12px' : '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? 'rgba(255,255,255,0.55)' : 'rgba(228,235,248,0.85)',
        backdropFilter: 'blur(10px)',
        border: isUser ? '1px solid rgba(0,188,212,0.4)' : '1px solid rgba(190,205,228,0.7)',
        fontSize: fontSize,
        lineHeight: 1.65,
        color: '#1a2035',
        fontFamily: 'Inter, sans-serif',
        wordBreak: 'break-word',
        boxShadow: isUser ? '0 2px 10px rgba(0,188,212,0.1)' : '0 2px 10px rgba(150,170,200,0.12)',
      }}>
        {isUser ? (
          msg.text
        ) : (
          <MarkdownRenderer content={msg.text} />
        )}
        {showTimestamp && (
          <div style={{
            fontSize: Math.max(10, fontSize - 3),
            marginTop: 4, opacity: 0.45, color: '#4a5568',
            textAlign: isUser ? 'right' : 'left',
          }}>
            {msg.time}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function ChatPanel({ messages, isTyping }) {
  const bottomRef = useRef(null)
  const { prefs, chatFontSize } = usePrefs()

  const lang          = prefs?.language || 'en'
  const compact       = !!prefs?.compactMode
  const showTimestamp = !!prefs?.timestamps
  const animations    = prefs?.animations !== false
  const fontSize      = chatFontSize || 14
  const t             = T[lang] || T.en

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: animations ? 'smooth' : 'auto' })
  }, [messages, isTyping, animations])

  if (messages.length === 0 && !isTyping) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'center',
        padding: '0 24px 20px',
      }}>
        <motion.div
          initial={animations ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 14, marginBottom: 14,
            background: 'rgba(0,188,212,0.1)',
            border: '1px solid rgba(0,188,212,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#00BCD4" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="#00BCD4" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="#4DD0E1" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: fontSize + 1, color: '#2a3555', marginBottom: 6 }}>
            {t.hello}
          </p>
          <p style={{ fontSize: fontSize - 1, color: '#7a85a0', lineHeight: 1.6, maxWidth: 220 }}>
            {t.sub}
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      padding: compact ? '10px 16px 6px' : '16px 20px 8px',
      scrollbarWidth: 'thin',
    }}>
      <AnimatePresence initial={false}>
        {messages.map(msg => (
          <Message
            key={msg.id}
            msg={msg}
            showTimestamp={showTimestamp}
            compact={compact}
            fontSize={fontSize}
          />
        ))}
        {isTyping && <TypingIndicator key="typing" />}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}