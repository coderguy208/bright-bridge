import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppHeader, MoodGauge } from '../components/layout/SharedUI.jsx'
import { useAuth } from '../features/auth/authContext.js'
import { getTodayEntry, localDateKey, saveTodayEntry } from '../features/journal/journalApi.js'

const catalog = [
  { name: 'Grounding Tools', to: '/resources/grounding-tools', words: ['sad', 'down', 'anxious', 'overwhelmed', 'stressed', 'panicking', 'scared', "can't sleep"] },
  { name: 'Conflict De-escalation', to: '/resources/conflict-de-escalation', words: ['angry', 'furious', 'mad', 'about to explode', 'fighting', 'arguing', 'yelling'] },
  { name: 'Relationship Microskills', to: '/resources/relationship-microskills', words: ['lonely', 'friend', 'partner', 'family', 'misunderstood', 'communication'] },
]
const danger = /suicide|kill myself|hurt myself|self harm|harm myself|hurt (him|her|them)|kill (him|her|them)/i

function matchedResources(note) {
  const text = note.toLowerCase()
  const matches = catalog.filter((resource) => resource.words.some((word) => text.includes(word)))
  return matches.length ? matches : catalog
}

function sendChatMessage(history, note) {
  const text = `${note} ${history.at(-1)?.text || ''}`.toLowerCase()
  if (danger.test(text)) return 'I’m really glad you told me. Please reach out to someone you trust right now. In the US, call or text 988, or contact emergency services if anyone is in immediate danger.'
  if (/angry|furious|mad|fight/.test(text)) return 'That sounds intense. Would taking a short pause before responding help right now? Conflict De-escalation is here when you are ready.'
  if (/sad|anxious|stress|overwhelm/.test(text)) return 'I hear that this feels heavy. What is one small thing that might help you feel a little more grounded?'
  if (/lonely|friend|partner|family/.test(text)) return 'Feeling disconnected can hurt. Is there one person you might feel safe checking in with today?'
  return 'Thank you for sharing. What feels most important about that moment?'
}

function CheckinGauge({ value, onChange }) {
  const selected = value ?? 50
  const needleAngle = -65 + (selected / 100) * 130
  const selectedX = 45 + (selected / 100) * 330
  function setFromPointer(event) {
    const bounds = event.currentTarget.getBoundingClientRect()
    onChange(Math.round(Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))))
  }
  function keyChange(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); onChange(Math.max(0, selected - 5)) }
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); onChange(Math.min(100, selected + 5)) }
  }
  return <div className="interactive-gauge">
    <p id="gauge-label">Choose how you&apos;re feeling</p>
    <svg viewBox="0 0 420 205" role="slider" aria-labelledby="gauge-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow={selected} tabIndex="0" onKeyDown={keyChange} onPointerDown={setFromPointer} onPointerMove={(event) => event.buttons === 1 && setFromPointer(event)}>
      <path className="interactive-gauge__low" d="M42 175 A168 168 0 0 1 128 29 L171 105 A80 80 0 0 0 122 175 Z" />
      <path className="interactive-gauge__mid" d="M128 29 A168 168 0 0 1 292 29 L249 105 A80 80 0 0 0 171 105 Z" />
      <path className="interactive-gauge__high" d="M292 29 A168 168 0 0 1 378 175 L298 175 A80 80 0 0 0 249 105 Z" />
      <line className="interactive-gauge__track" x1="45" y1="175" x2="375" y2="175" />
      <g className="interactive-gauge__needle" style={{ transform: `rotate(${needleAngle}deg)` }}><path d="M210 176 L199 77 L221 77 Z" /><circle cx="210" cy="175" r="23" /><circle cx="210" cy="175" r="11" /></g>
      <circle className="interactive-gauge__selected" cx={selectedX} cy="175" r="8" />
    </svg>
    <span>{value === null ? 'Tap or drag to choose a level' : `${value}% selected`}</span>
  </div>
}

export default function DailyCheckinPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const saved = getTodayEntry(user.id)
  const [note, setNote] = useState(() => saved?.content || '')
  const [value, setValue] = useState(() => Number.isFinite(saved?.value) ? saved.value : null)
  const [resources, setResources] = useState(() => saved?.resources ? catalog.filter((item) => saved.resources.includes(item.name)) : null)
  const [chat, setChat] = useState(false)
  const [history, setHistory] = useState([])
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')

  function updateNote(event) {
    setNote(event.target.value)
    setResources(null)
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    if (value === null) { setError('Please pick a level on the gauge first.'); return }
    const selected = matchedResources(note)
    saveTodayEntry(user.id, { date: localDateKey(), value, text: note.trim(), content: note.trim(), resources: selected.map((item) => item.name) })
    setResources(selected)
    setChat(false)
  }

  function talk() {
    if (!note.trim()) { setError('Write a note first so the companion has something to respond to.'); return }
    setChat(true)
    setHistory([{ role: 'companion', text: sendChatMessage([], note) }])
  }

  function send(event) {
    event.preventDefault()
    if (!reply.trim()) return
    const next = [...history, { role: 'you', text: reply.trim() }]
    setHistory([...next, { role: 'companion', text: sendChatMessage(next, note) }])
    setReply('')
  }

  const resultText = /angry|furious|sad|anxious|overwhelmed|hopeless|scared|stressed|lonely/i.test(note)
    ? 'You may need extra support today.'
    : /good|happy|calm|great|grateful|hopeful|proud/i.test(note)
      ? 'A positive check-in.'
      : 'A steady check-in.'

  return <div className="logged-page">
    <AppHeader />
    <main className="checkin-demo">
      <section className="checkin-card">
        <h1>Daily Check-in</h1>
        <form onSubmit={submit}>
          <CheckinGauge value={value} onChange={(nextValue) => { setValue(nextValue); setResources(null); setError('') }} />
          <label className="sr-only" htmlFor="checkin-note">How are you feeling?</label>
          <textarea id="checkin-note" value={note} onChange={updateNote} placeholder="let's talk about it!" />
          <div className="checkin-actions">
            <button type="button" onClick={talk} aria-label="Open support companion">?</button>
            <button type="submit">SUBMIT</button>
            <button type="button" onClick={() => navigate('/home')}>BACK</button>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>
        {danger.test(note) && <p className="safety">You deserve support right now. Please reach out to someone you trust, call or text <strong>988</strong> in the US, or contact emergency services. <Link to="/help">SOS resources</Link></p>}
        {resources && <>
          <div className="gauge-result"><MoodGauge note={note} compact /><span>{resultText}</span></div>
          <div className="resource-cards">{resources.map((item) => <Link key={item.name} to={item.to}>{item.name}</Link>)}</div>
          <Link className="continue" to="/home">Continue to dashboard</Link>
        </>}
        <div className="icon-tiles">
          <Link to="/resources/grounding-tools" aria-label="Grounding Tools">🧠</Link>
          <Link to="/resources/conflict-de-escalation" aria-label="Conflict De-escalation">🗣️</Link>
          <Link to="/resources/relationship-microskills" aria-label="Relationship Microskills">🤝</Link>
        </div>
        <p>After submitting the check-in, applicable resources will appear from the resources catalog.</p>
      </section>
      {chat && <section className="chat-panel" aria-label="Support companion">
        <h2>Support companion</h2><p>This is a support companion, not a therapist or a replacement for a real person.</p>
        {history.map((item, index) => <p key={index} className={item.role}>{item.text}</p>)}
        <form onSubmit={send}><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply" /><button>SEND</button></form>
      </section>}
    </main>
  </div>
}
