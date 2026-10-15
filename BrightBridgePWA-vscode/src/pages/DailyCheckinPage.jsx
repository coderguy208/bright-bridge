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

const moods = {
  red: { label: 'Red mood', angle: -56 },
  yellow: { label: 'Yellow mood', angle: 0 },
  green: { label: 'Green mood', angle: 56 },
}

function MoodGaugeSelector({ mood, onChange }) {
  const needleAngle = mood ? moods[mood].angle : 0

  return <div className="mood-gauge-selector" aria-label="Choose how you are feeling">
    <svg viewBox="0 0 440 280" role="img" aria-label={mood ? `${moods[mood].label} selected` : 'Mood gauge'}>
      <path className="mood-gauge-selector__wedge mood-gauge-selector__wedge--red" d="M40 220 A180 180 0 0 1 130 64 L177 145 A88 88 0 0 0 132 220 Z" onClick={() => onChange('red')} />
      <path className="mood-gauge-selector__wedge mood-gauge-selector__wedge--yellow" d="M130 64 A180 180 0 0 1 310 64 L263 145 A88 88 0 0 0 177 145 Z" onClick={() => onChange('yellow')} />
      <path className="mood-gauge-selector__wedge mood-gauge-selector__wedge--green" d="M310 64 A180 180 0 0 1 400 220 L308 220 A88 88 0 0 0 263 145 Z" onClick={() => onChange('green')} />
      <g className="mood-gauge-selector__needle" style={{ transform: `rotate(${needleAngle}deg)` }}>
        <path d="M220 221 L207 83 L233 83 Z" />
        <circle cx="220" cy="220" r="25" />
        <circle cx="220" cy="220" r="12" />
      </g>
    </svg>
  </div>
}

export default function DailyCheckinPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const saved = getTodayEntry(user.id)
  const [note, setNote] = useState(() => saved?.content || '')
  const [mood, setMood] = useState(() => ['red', 'yellow', 'green'].includes(saved?.mood) ? saved.mood : null)
  const [resources, setResources] = useState(() => saved?.resources ? catalog.filter((item) => saved.resources.includes(item.name)) : null)
  const [showPrompts, setShowPrompts] = useState(false)
  const [error, setError] = useState('')

  function updateNote(event) {
    setNote(event.target.value)
    setResources(null)
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    if (!mood) { setError('Please pick how you are feeling first.'); return }
    const selected = matchedResources(note)
    saveTodayEntry(user.id, { mood, text: note.trim(), date: localDateKey(), content: note.trim(), resources: selected.map((item) => item.name) })
    setResources(selected)
    setShowPrompts(false)
  }

  const resultText = /angry|furious|sad|anxious|overwhelmed|hopeless|scared|stressed|lonely/i.test(note)
    ? 'You may need extra support today.'
    : /good|happy|calm|great|grateful|hopeful|proud/i.test(note)
      ? 'A positive check-in.'
      : 'A steady check-in.'

  return <div className="logged-page">
    <AppHeader />
    <main className="checkin-demo">
      <div className="checkin-layout-v2">
      <section className="checkin-left-column">
        <MoodGaugeSelector mood={mood} onChange={(nextMood) => { setMood(nextMood); setResources(null); setError('') }} />
        <h1>Daily Check-in</h1>
        <p className="checkin-feeling">how are you feeling?</p>
        <div className="mood-color-buttons" role="group" aria-label="Mood selection">
          {Object.entries(moods).map(([key, details]) => <button key={key} type="button" className={`mood-color-button mood-color-button--${key} ${mood === key ? 'is-selected' : ''}`} aria-label={details.label} aria-pressed={mood === key} onClick={() => { setMood(key); setResources(null); setError('') }} />)}
        </div>
      </section>
      <div className="checkin-divider" aria-hidden="true"><i /><i /></div>
      <section className="checkin-right-column">
        {showPrompts && <aside id="checkin-prompts" className="checkin-prompts" aria-label="Check-in prompts">
          <p>What is one thing that went well today?</p>
          <p>What has been weighing on you?</p>
          <p>Who did you talk to today, and how did it go?</p>
          <p>What is one small thing that would help you tonight?</p>
        </aside>}
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="checkin-note">How are you feeling?</label>
          <textarea id="checkin-note" value={note} onChange={updateNote} placeholder="let's talk about it!" />
          <div className="checkin-actions">
            <button type="button" onClick={() => setShowPrompts((open) => !open)} aria-expanded={showPrompts} aria-controls="checkin-prompts">?</button>
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
      </div>
    </main>
  </div>
}
