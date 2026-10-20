import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  MoodSelector,
  Gauge,
  PageHeader,
  QuickExit,
  StatusMessage,
} from '../components/layout/SharedUI.jsx'
import { useAuth } from '../features/auth/authContext.js'
import { markOnboardingComplete } from '../features/auth/authClient.js'
import { getTodayEntry, saveTodayEntry } from '../features/journal/journalApi.js'
import usePageTitle from '../lib/usePageTitle.js'

const companionReplies = {
  sad: 'That sounds like a lot to carry. You do not have to solve everything at once. What is one small thing that could make the next hour a little gentler?',
  neutral: 'Thank you for checking in with yourself. I am here to listen. What part of your day feels most worth putting into words?',
  happy: 'I love that you made space to notice this bright moment. What helped create this feeling, and how could you bring a little of it into tomorrow?',
}

// JournalPage serves both first-use onboarding and editing today's existing entry.
export default function JournalPage() {
  const [searchParams] = useSearchParams()
  const editMode = searchParams.get('mode') === 'edit'
  usePageTitle(editMode ? "Edit Today's Entry" : 'Welcome Home')

  const { displayName, logout, user } = useAuth()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [companionOpen, setCompanionOpen] = useState(false)
  const [conversation, setConversation] = useState([])
  const [prompted, setPrompted] = useState(false)

  const suggestedReply = useMemo(() => companionReplies[mood] || companionReplies.neutral, [mood])

  function startConversation() {
    setCompanionOpen(true)
    if (!prompted) {
      const noteContext = content.trim() ? ` I noticed you wrote: “${content.trim().slice(0, 130)}${content.trim().length > 130 ? '…' : ''}”` : ''
      setConversation([{ role: 'assistant', text: `${suggestedReply}${noteContext}` }])
      setPrompted(true)
    }
  }

  useEffect(() => {
    let active = true
    getTodayEntry()
      .then((entry) => {
        if (!active || !entry) return
        setContent(entry.content || '')
        setMood(entry.mood || null)
      })
      .catch((error) => {
        if (active) setMessage(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user?.id])

  // Save one complete entry, then follow the onboarding or edit return flow.
  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (!content.trim() && !mood) {
      setMessage('Choose a mood or write a short note before continuing.')
      return
    }

    setSaving(true)
    try {
      await saveTodayEntry({ content, mood })
      if (!editMode) {
        try {
          await markOnboardingComplete(user)
        } catch (metadataError) {
          console.warn('Journal saved, but onboarding metadata could not be updated.', metadataError)
          setMessage('Your entry was saved, but account setup could not be finished. Please select Continue again.')
          return
        }
      }
      navigate(editMode ? '/daily-checkin' : '/home', { replace: true })
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  // Onboarding exposes logout while edit mode uses an explicit history back link.
  async function handleLogout() {
    setMessage('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="page-shell journal-page">
      <PageHeader
        title={editMode ? "Today's Entry" : 'BrightBridge'}
        backTo={editMode ? '/daily-checkin' : undefined}
        backLabel="Diary Entries"
        actionLabel={editMode ? undefined : 'Log Out'}
        actionDisabled={saving}
        onAction={handleLogout}
      />

      <main className="container page-main journal-main">
        <section className="welcome-section fade-in">
          <h1>Hi {displayName},<br />welcome home!</h1>
        </section>

        <form onSubmit={handleSubmit}>
          <section className="mood-checkin soft-card fade-in">
            <h2>How are you feeling today?</h2>
            <p className="checkin-intro">Pick the color that best matches your energy right now.</p>
            <MoodSelector value={mood} onChange={(nextMood) => { setMood(nextMood); setPrompted(false) }} disabled={loading || saving} />
            <Gauge mood={mood === 'sad' ? 'red' : mood === 'happy' ? 'green' : 'yellow'} compact />
          </section>

          <section className={`daily-journal soft-card fade-in${companionOpen ? ' daily-journal--raised' : ''}`}>
            <h2>How was your day?</h2>
            <label htmlFor="daily-entry" className="sr-only">Write about your day</label>
            <textarea
              id="daily-entry"
              className="form-textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="start typing..."
              rows="6"
              maxLength="10000"
              disabled={loading || saving}
            />
            <button type="button" className="companion-toggle" onClick={startConversation} aria-expanded={companionOpen}>
              <span aria-hidden="true">?</span> Talk it through
            </button>
            <StatusMessage tone="error">{message}</StatusMessage>
            <button type="submit" className="btn btn-primary btn-large full-width" disabled={loading || saving}>
              {saving
                ? 'Saving…'
                : editMode
                  ? 'Save Changes and Return to Daily Check-In'
                  : 'Continue to Dashboard'}
            </button>
          </section>

          {companionOpen ? (
            <section className="companion-panel" aria-label="BrightBridge reflection companion">
              <div className="companion-panel__art" aria-hidden="true"><span>🧠</span><span>💬</span></div>
              <div className="companion-panel__body">
                <p className="eyebrow">BRIGHTBRIDGE COMPANION</p>
                <h2>A gentle place to reflect</h2>
                {conversation.map((item, index) => <p className="companion-message" key={index}>{item.text}</p>)}
                <p className="companion-note">Demo mode: this response is generated in your browser from the mood and note on this page. A production LLM should be called through a protected server endpoint.</p>
              </div>
            </section>
          ) : null}
        </form>
      </main>
      <QuickExit />
    </div>
  )
}
