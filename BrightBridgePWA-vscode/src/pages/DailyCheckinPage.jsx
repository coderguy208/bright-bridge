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

export default function DailyCheckinPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const saved = getTodayEntry(user.id)
  const [note, setNote] = useState(() => saved?.content || '')
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
    if (!note.trim()) { setError('Please write a short note before submitting.'); return }
    const selected = matchedResources(note)
    saveTodayEntry(user.id, { date: localDateKey(), content: note.trim(), resources: selected.map((item) => item.name) })
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
