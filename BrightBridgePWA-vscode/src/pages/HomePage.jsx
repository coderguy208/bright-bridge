import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader, Gauge } from '../components/layout/SharedUI.jsx'
import { useAuth } from '../features/auth/authContext.js'
import { getRecentEntries, getTodayEntry, localDateKey, subscribeToCheckins } from '../features/journal/journalApi.js'
import usePageTitle from '../lib/usePageTitle.js'
import { resourceIcons } from '../utils/resourceIcons.js'
import calmRoomImg from '../assets/icons/calm-room.png'

export const SHOW_SAMPLE_CALENDAR_FOR_DEV = true

const resourceLinks = [
  { id: 'grounding', label: 'Grounding Tools', tone: 'grounding' },
  { id: 'conflict', label: 'Conflict De-escalation', tone: 'conflict' },
  { id: 'microskills', label: 'Relationship Microskills', tone: 'microskills' },
]

const dashboardResourceTiles = [
  { id: 'grounding' },
  { id: 'conflict' },
  { id: 'microskills' },
]

function dateKeyDaysAgo(daysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return localDateKey(date)
}

function sampleCalendarEntries() {
  const moods = ['green', 'yellow', 'green', 'red', 'yellow', 'green', 'green', 'yellow']
  return Array.from({ length: 28 }, (_, index) => {
    const daysAgo = 27 - index
    const inCurrentStreak = daysAgo < 9
    const scatteredCheckin = [11, 14, 18, 21, 25].includes(daysAgo)
    return inCurrentStreak || scatteredCheckin
      ? { date: dateKeyDaysAgo(daysAgo), mood: moods[index % moods.length] }
      : null
  }).filter(Boolean)
}

function CalendarCheck({ mood }) {
  return <div className={`streak-day${mood ? ' streak-day--complete' : ''}`}>
    {mood && <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" /><path d="M10 18 L16 24 L27 11" /></svg>}
    {mood && <span className={`streak-mood streak-mood--${mood}`} />}
  </div>
}

function streakLength(entries) {
  const checkedDates = new Set(entries.map((entry) => entry.date))
  let offset = checkedDates.has(dateKeyDaysAgo(0)) ? 0 : 1
  let count = 0
  while (checkedDates.has(dateKeyDaysAgo(offset))) { count += 1; offset += 1 }
  return count
}

function StreakCalendar({ entries, now }) {
  const mergedEntries = new Map(SHOW_SAMPLE_CALENDAR_FOR_DEV ? sampleCalendarEntries().map((entry) => [entry.date, entry]) : [])
  entries.forEach((entry) => mergedEntries.set(entry.date, entry))
  const streak = streakLength(Array.from(mergedEntries.values()))
  const year = now.getFullYear()
  const monthIndex = now.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const month = now.toLocaleDateString(undefined, { month: 'long' })
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, monthIndex, index + 1)
    return { dateKey: localDateKey(date), entry: mergedEntries.get(localDateKey(date)) }
  })
  return <section className="streak-calendar" aria-label="Check-in streak calendar">
    <div className="streak-rings" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</div>
    <header className="streak-calendar__header"><h2>{month}</h2></header>
    <div className="streak-calendar__days">{Array.from({ length: firstWeekday }, (_, index) => <div className="streak-day streak-day--spacer" key={`spacer-${index}`} aria-hidden="true" />)}{days.map(({ dateKey, entry }) => <CalendarCheck key={dateKey} mood={entry?.mood} />)}</div>
    <footer><strong>{streak}-Day Streak!</strong>{streak >= 3 && <span>YOU&apos;RE KILLING IT</span>}</footer>
  </section>
}

function DashboardIconTiles() {
  return <div className="dash-icons">{dashboardResourceTiles.map(({ id }) => {
    const icon = resourceIcons[id]
    return <Link key={id} to={icon.to} state={{ from: '/home' }}><img src={icon.src} alt={icon.alt} width={icon.width} height={icon.height} /></Link>
  })}</div>
}

function Checkmark({ complete }) {
  return <span className={`daily-card__check ${complete ? 'daily-card__check--complete' : ''}`} aria-hidden="true">{complete && '✓'}</span>
}

function SosModal({ close }) {
  return <div className="sos-modal" role="dialog" aria-modal="true"><div><h2>You&apos;re not alone.</h2><p>Consider reaching out to someone you trust. In the US, call or text <strong>988</strong> for the Suicide & Crisis Lifeline. Call 911 if there is immediate danger.</p><button onClick={close}>Close</button></div></div>
}

export default function HomePage() {
  usePageTitle('Dashboard')
  const { user } = useAuth()
  const [, setCheckinVersion] = useState(0)
  const [sos, setSos] = useState(false)
  const [calendarNow, setCalendarNow] = useState(() => new Date())
  useEffect(() => subscribeToCheckins(user.id, () => setCheckinVersion((version) => version + 1)), [user.id])
  useEffect(() => {
    const untilTomorrow = new Date(calendarNow.getFullYear(), calendarNow.getMonth(), calendarNow.getDate() + 1).getTime() - Date.now()
    const timeout = window.setTimeout(() => setCalendarNow(new Date()), untilTomorrow)
    return () => window.clearTimeout(timeout)
  }, [calendarNow])
  const today = getTodayEntry(user.id)
  const entries = getRecentEntries(user.id)

  return <div className="logged-page dashboard-page-v2">
    <AppHeader />
    <main className="dashboard-v2">
      <h1>Dashboard</h1>
      <div className="dashboard-v2__columns">
        <section className="dashboard-v2__left">
          <Link className="daily-card daily-card--v2" to="/daily-checkin">
            <span>Daily Check-in</span><Checkmark complete={Boolean(today)} />
            <Gauge mood={today?.mood} note={today?.content || ''} compact />
            <small className="sr-only">{today ? 'Completed today' : 'Tap to check in'}</small>
          </Link>
          <DashboardIconTiles />
          <Link className="orange-link dashboard-resources" to="/resources">Resources</Link>
        </section>

        <section className="dashboard-v2__middle">
          <div className="dashboard-resource-links">{resourceLinks.map((item) => <Link key={item.id} className={`resource-link resource-link--${item.tone}`} to={resourceIcons[item.id].to} state={{ from: '/home' }}>{item.label}</Link>)}</div>
          <div className="picture-panel picture-panel--room"><img src={calmRoomImg} alt="Cozy room with a sunset window, bookshelf, armchair, plant, and a small character" width="644" height="268" /></div>
        </section>

        <aside className="dashboard-v2__right">
          <StreakCalendar entries={entries} now={calendarNow} />
          <div className="dashboard-controls"><Link className="settings-link settings-link--v2" to="/settings"><span>SETTINGS</span><i aria-hidden="true">⚙</i></Link><button className="sos-button sos-button--v2" onClick={() => setSos(true)}>SOS</button></div>
        </aside>
      </div>
    </main>
    {sos && <SosModal close={() => setSos(false)} />}
  </div>
}
