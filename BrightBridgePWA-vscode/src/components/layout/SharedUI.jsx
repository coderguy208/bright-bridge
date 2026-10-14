import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
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

export function MoodGauge({ note = '', compact = false }) {
  const low = /angry|furious|sad|anxious|overwhelmed|hopeless|scared|stressed|lonely/i.test(note); const high = /good|happy|calm|great|grateful|hopeful|proud/i.test(note); const angle = low ? -56 : high ? 56 : 0
  return <div className={`shared-gauge${compact ? ' shared-gauge--compact' : ''}`}><svg viewBox="0 0 420 250" role="img" aria-label={low ? 'Struggling mood' : high ? 'Positive mood' : 'Neutral mood'}><path className="gauge-segment gauge-segment--red" d="M30 210 A180 180 0 0 1 120 54 L164 126 A96 96 0 0 0 114 210 Z" /><path className="gauge-segment gauge-segment--yellow" d="M120 54 A180 180 0 0 1 300 54 L256 126 A96 96 0 0 0 164 126 Z" /><path className="gauge-segment gauge-segment--green" d="M300 54 A180 180 0 0 1 390 210 L306 210 A96 96 0 0 0 256 126 Z" /><g className="gauge-needle" style={{ transform: `rotate(${angle}deg)` }}><path d="M210 211 L198 91 L222 91 Z" /><circle cx="210" cy="210" r="25" /><circle className="gauge-hub" cx="210" cy="210" r="13" /></g></svg></div>
}
