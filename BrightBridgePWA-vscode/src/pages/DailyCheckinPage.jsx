import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppHeader, Gauge } from '../components/layout/SharedUI.jsx'
import { useAuth } from '../features/auth/authContext.js'
import { getTodayEntry, localDateKey, saveTodayEntry } from '../features/journal/journalApi.js'
import groundingToolsImg from '../assets/icons/grounding-tools.png'
import conflictDeescalationImg from '../assets/icons/conflict-deescalation.png'
import relationshipMicroskillsImg from '../assets/icons/relationship-microskills.png'
import { recommendResources } from '../utils/recommendResources.js'

const resourceTiles = [
  { id: 'grounding', name: 'Grounding Tools', to: '/resources/grounding-tools', image: groundingToolsImg, width: 272, height: 266 },
  { id: 'conflict', name: 'Conflict De-escalation', to: '/resources/conflict-de-escalation', image: conflictDeescalationImg, width: 322, height: 290 },
  { id: 'microskills', name: 'Relationship Microskills', to: '/resources/relationship-microskills', image: relationshipMicroskillsImg, width: 296, height: 338 },
]
const danger = /suicide|kill myself|hurt myself|self harm|harm myself|hurt (him|her|them)|kill (him|her|them)/i

const moods = { red: { label: 'Red mood' }, yellow: { label: 'Yellow mood' }, green: { label: 'Green mood' } }

export default function DailyCheckinPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const saved = getTodayEntry(user.id)
  const [note, setNote] = useState(() => saved?.content || '')
  const [mood, setMood] = useState(() => ['red', 'yellow', 'green'].includes(saved?.mood) ? saved.mood : null)
  const [recommendedIds, setRecommendedIds] = useState([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [error, setError] = useState('')

  function updateNote(event) {
    setNote(event.target.value)
    setRecommendedIds([])
    setHasSubmitted(false)
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    if (!mood) { setError('Please pick how you are feeling first.'); return }
    const selectedIds = recommendResources({ mood, text: note })
    const selected = selectedIds.map((id) => resourceTiles.find((tile) => tile.id === id))
    saveTodayEntry(user.id, { mood, text: note.trim(), date: localDateKey(), content: note.trim(), resources: selected.map((item) => item.name) })
    setRecommendedIds(selectedIds)
    setHasSubmitted(true)
    setShowPrompts(false)
  }

  return <div className="logged-page">
    <AppHeader />
    <main className="checkin-demo">
      <div className="checkin-layout-v2">
      <section className="checkin-left-column">
        <Gauge mood={mood} onChange={(nextMood) => { setMood(nextMood); setRecommendedIds([]); setHasSubmitted(false); setError('') }} />
        <h1>Daily Check-in</h1>
        <p className="checkin-feeling">how are you feeling?</p>
        <div className="mood-color-buttons" role="group" aria-label="Mood selection">
          {Object.entries(moods).map(([key, details]) => <button key={key} type="button" className={`mood-color-button mood-color-button--${key} ${mood === key ? 'is-selected' : ''}`} aria-label={details.label} aria-pressed={mood === key} onClick={() => { setMood(key); setRecommendedIds([]); setHasSubmitted(false); setError('') }} />)}
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
            <button type="button" onClick={() => { setHasSubmitted(false); setRecommendedIds([]); navigate('/home') }}>BACK</button>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>
        {danger.test(note) && <p className="safety">You deserve support right now. Please reach out to someone you trust, call or text <strong>988</strong> in the US, or contact emergency services. <Link to="/help">SOS resources</Link></p>}
        <div className="recommendations-slot">
          {hasSubmitted ? <section className="recommendations" aria-live="polite">
            <h2>Recommended for you</h2>
            <div className="icon-tiles">
              {recommendedIds.map((id) => {
                const tile = resourceTiles.find((item) => item.id === id)
                return <Link key={tile.id} to={tile.to} aria-label={tile.name}><img src={tile.image} alt={tile.name} width={tile.width} height={tile.height} /></Link>
              })}
            </div>
          </section> : <div className="recommendations-placeholder" aria-hidden="true" />}
        </div>
      </section>
      </div>
    </main>
  </div>
}
