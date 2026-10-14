import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuickExit, StatusMessage } from '../components/layout/SharedUI.jsx'
import { useAuth } from '../features/auth/authContext.js'
import { getTodayEntry, saveTodayEntry } from '../features/journal/journalApi.js'
import usePageTitle from '../lib/usePageTitle.js'

const moods = [{ value: 'sad', label: 'Low', color: 'red', angle: -56 }, { value: 'neutral', label: 'Steady', color: 'yellow', angle: 0 }, { value: 'happy', label: 'Bright', color: 'green', angle: 56 }]
const formatDate = (date) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)

function CheckinHeader() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer) }, [])
  return <header className="sunset-header checkin-header"><time>{formatDate(now)}</time><h1>BrightBridge</h1><time>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></header>
}

function MoodGauge({ mood }) {
  const selected = moods.find((item) => item.value === mood) || moods[0]
  return <div className="checkin-gauge" aria-label={`Mood gauge: ${selected.label}`}><svg viewBox="0 0 420 250" role="img" aria-hidden="true">
    <path className="gauge-segment gauge-segment--red" d="M30 210 A180 180 0 0 1 120 54 L164 126 A96 96 0 0 0 114 210 Z" /><path className="gauge-segment gauge-segment--yellow" d="M120 54 A180 180 0 0 1 300 54 L256 126 A96 96 0 0 0 164 126 Z" /><path className="gauge-segment gauge-segment--green" d="M300 54 A180 180 0 0 1 390 210 L306 210 A96 96 0 0 0 256 126 Z" />
    <g className="gauge-needle" style={{ transform: `rotate(${selected.angle}deg)` }}><path d="M210 211 L198 91 L222 91 Z" /><circle cx="210" cy="210" r="25" /><circle className="gauge-hub" cx="210" cy="210" r="13" /></g>
  </svg></div>
}

export default function DailyCheckinPage() {
  usePageTitle('Daily Check-In')
  const { user } = useAuth(); const navigate = useNavigate()
  const [mood, setMood] = useState(null); const [content, setContent] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState(''); const [showPrompt, setShowPrompt] = useState(false)
  useEffect(() => { let active = true; getTodayEntry().then((entry) => { if (!active || !entry) return; setMood(entry.mood || null); setContent(entry.content || '') }).catch((error) => active && setMessage(error.message)).finally(() => active && setLoading(false)); return () => { active = false } }, [user?.id])
  async function submit(event) { event.preventDefault(); setMessage(''); setShowPrompt(false); if (!mood && !content.trim()) { setMessage('Choose a color or add a note before submitting.'); return }; setSaving(true); try { await saveTodayEntry({ mood, content }); navigate('/home', { replace: true }) } catch (error) { setMessage(error.message) } finally { setSaving(false) } }
  return <div className="checkin-page page-shell"><CheckinHeader /><main className="checkin-layout"><section className="checkin-side checkin-side--mood"><MoodGauge mood={mood} /><h2>Daily Check-in</h2><p className="checkin-question">how are you feeling?</p><div className="checkin-colors" role="group" aria-label="How are you feeling?">{moods.map((item) => <button key={item.value} type="button" className={`checkin-color checkin-color--${item.color}${mood === item.value ? ' is-selected' : ''}`} onClick={() => setMood(item.value)} aria-label={item.label} aria-pressed={mood === item.value} disabled={loading || saving} />)}</div></section><form className="checkin-side checkin-side--entry" onSubmit={submit}><div className="checkin-note-wrap"><label className="sr-only" htmlFor="checkin-note">Tell us about your day</label><textarea id="checkin-note" value={content} onChange={(event) => setContent(event.target.value)} placeholder="let’s talk about it!" disabled={loading || saving} />{showPrompt ? <div className="reflection-prompts"><strong>A reflection for you</strong><p>What made today feel this way?</p><p>What is one thing you need right now?</p></div> : null}</div><div className="checkin-actions"><button className="prompt-button" type="button" onClick={() => setShowPrompt((visible) => !visible)} aria-label="Show reflection prompts">?</button><button className="submit-button" disabled={loading || saving} type="submit">{saving ? 'SAVING…' : 'SUBMIT'}</button><button className="back-button" type="button" onClick={() => navigate('/home')}>BACK</button></div><StatusMessage tone="error">{message}</StatusMessage></form></main><QuickExit /></div>
}
