import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/authContext.js'

// Preserve the original bridge-and-sun artwork as a scalable inline logo.
export function BrandLogo() {
  return (
    <svg
      className="app-logo"
      width="200"
      height="200"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="BrightBridge sun and bridge logo"
    >
      <circle cx="100" cy="78" r="42" fill="#D98200" />
      <g stroke="#D98200" strokeWidth="4" strokeLinecap="round"><line x1="100" y1="26" x2="100" y2="13" /><line x1="65" y1="40" x2="54" y2="29" /><line x1="135" y1="40" x2="146" y2="29" /><line x1="49" y1="76" x2="34" y2="76" /><line x1="151" y1="76" x2="166" y2="76" /></g>
      <g fill="#1E1B1C"><rect x="22" y="111" width="156" height="9" rx="3" /><rect x="47" y="88" width="9" height="33" /><rect x="144" y="88" width="9" height="33" /></g>
      <g fill="none" stroke="#1E1B1C" strokeWidth="4"><path d="M26 111 L51 88 L100 119 L149 88 L174 111" /><path d="M50 88 Q100 145 150 88" /></g>
      <g><path d="M31 62 h22 a8 8 0 0 1 8 8 v5 a8 8 0 0 1-8 8 H43 l-7 7 1-7 h-6 a8 8 0 0 1-8-8 v-5 a8 8 0 0 1 8-8" fill="#fff" /><circle cx="38" cy="72" r="2" /><circle cx="45" cy="72" r="2" /><circle cx="52" cy="72" r="2" /></g>
      <g><path d="M144 61 h22 a8 8 0 0 1 8 8 v5 a8 8 0 0 1-8 8 h-10 l-6 7 1-7 h-7 a8 8 0 0 1-8-8 v-5 a8 8 0 0 1 8-8" fill="#1E1B1C" /><circle cx="153" cy="71" r="2" fill="#fff" /><circle cx="160" cy="71" r="2" fill="#fff" /><circle cx="167" cy="71" r="2" fill="#fff" /></g>
    </svg>
  )
}

// Safety controls remain fixed and reachable across the same pages as the legacy app.
export function QuickExit() {
  return (
    <a href="https://www.weather.com" className="quick-exit" aria-label="Quick exit to weather website">
      quick exit
    </a>
  )
}

export function HelpFab() {
  return (
    <Link to="/help" className="help-fab pulse" aria-label="Get help now">
      HELP
    </Link>
  )
}

// Shared page header supports a safe explicit back route and one optional action.
export function PageHeader({
  title,
  backTo,
  backLabel = 'Back',
  actionLabel,
  actionDisabled = false,
  onAction,
}) {
  return (
    <header className="page-header gradient-header">
      <div className="container page-header__inner">
        {backTo ? (
          <Link to={backTo} className="header-control header-control--left">
            ← {backLabel}
          </Link>
        ) : null}
        <h1>{title}</h1>
        {actionLabel ? (
          <button
            type="button"
            className="header-control header-control--right"
            onClick={onAction}
            disabled={actionDisabled}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </header>
  )
}

const moods = [
  { value: 'sad', emoji: '☹', label: 'Low / red' },
  { value: 'neutral', emoji: '•', label: 'Steady / yellow' },
  { value: 'happy', emoji: '☀', label: 'Bright / green' },
]

// A controlled selector avoids implicit browser event globals and works on Safari.
export function MoodSelector({ value, onChange, disabled = false, compact = false }) {
  return (
    <div className={`mood-selector${compact ? ' mood-selector--compact' : ''}`} role="group" aria-label="Select your mood">
      {moods.map((mood) => (
        <button
          key={mood.value}
          type="button"
          className={`mood-btn ${mood.value}${value === mood.value ? ' active' : ''}`}
          onClick={() => onChange(mood.value)}
          aria-label={`${mood.label} mood`}
          aria-pressed={value === mood.value}
          disabled={disabled}
        >
          <span aria-hidden="true">{mood.emoji}</span><span className="mood-btn__label">{mood.label.split(' / ')[0]}</span>
        </button>
      ))}
    </div>
  )
}

// StatusMessage gives async success and failure text a consistent accessible treatment.
export function StatusMessage({ children, tone = 'info' }) {
  if (!children) return null
  return (
    <p className={`status-message status-message--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}

export function AppHeader() {
  const { displayName, logout } = useAuth(); const navigate = useNavigate(); const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(id) }, [])
  async function leave() { await logout(); navigate('/') }
  return <header className="app-header"><div className="app-header__date"><time>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time><time>{now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</time></div><h1>BrightBridge</h1><div className="app-header__user"><span>Welcome home, {displayName}!</span><button type="button" onClick={leave}>Log out</button></div></header>
}

const ANGLES = { red: -60, yellow: 0, green: 60 }
const GAUGE_CENTER_X = 220
const GAUGE_CENTER_Y = 220

export function Gauge({ mood, note = '', compact = false, onChange, duration = 700 }) {
  const inferredMood = /angry|furious|sad|anxious|overwhelmed|hopeless|scared|stressed|lonely/i.test(note)
    ? 'red'
    : /good|happy|calm|great|grateful|hopeful|proud/i.test(note) ? 'green' : 'yellow'
  const selectedMood = mood === undefined ? inferredMood : (mood || 'yellow')
  const target = ANGLES[selectedMood] ?? 0
  const label = { red: 'Struggling mood', yellow: 'Neutral mood', green: 'Positive mood' }[selectedMood]
  const [angle, setAngle] = useState(target)
  const angleRef = useRef(target)
  const frameRef = useRef(null)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = angleRef.current
    if (reduce || from === target) {
      angleRef.current = target
      setAngle(target)
      return undefined
    }
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (target - from) * eased
      angleRef.current = next
      setAngle(next)
      if (t < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])
  const choose = onChange ? (nextMood) => onChange(nextMood) : undefined

  return <div className={`shared-gauge mood-gauge-selector${compact ? ' shared-gauge--compact' : ''}${onChange ? ' mood-gauge-selector--interactive' : ''}`}>
    <svg viewBox="0 0 440 285" overflow="visible" role="img" aria-label={label}>
      <path className="mood-gauge-selector__wedge mood-gauge-selector__wedge--red" d="M40 220 A180 180 0 0 1 130 64 L220 220 Z" onClick={choose ? () => choose('red') : undefined} />
      <path className="mood-gauge-selector__wedge mood-gauge-selector__wedge--yellow" d="M130 64 A180 180 0 0 1 310 64 L220 220 Z" onClick={choose ? () => choose('yellow') : undefined} />
      <path className="mood-gauge-selector__wedge mood-gauge-selector__wedge--green" d="M310 64 A180 180 0 0 1 400 220 L220 220 Z" onClick={choose ? () => choose('green') : undefined} />
      <g transform={`rotate(${angle} ${GAUGE_CENTER_X} ${GAUGE_CENTER_Y})`}>
        <path className="mood-gauge-selector__rod" d="M196 220 L220 139 L244 220 Z" />
      </g>
      <g className="mood-gauge-selector__hub"><circle cx="220" cy="220" r="28" /><circle cx="220" cy="220" r="12" /></g>
    </svg>
  </div>
}
