import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QuickExit } from '../components/layout/SharedUI.jsx'
import { useAuth } from '../features/auth/authContext.js'
import usePageTitle from '../lib/usePageTitle.js'

function DashboardHeader({ displayName, onLogout }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer) }, [])
  const date = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(now)
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return <header className="sunset-header dashboard-sunset-header"><div><time>{time}</time><time>{date}</time></div><h1>BrightBridge</h1><div className="dashboard-welcome">Welcome home,<br />{displayName}!</div><button type="button" className="dashboard-logout" onClick={onLogout}>Log out</button></header>
}

export default function HomePage() {
  usePageTitle('Dashboard')
  const { displayName, logout } = useAuth(); const navigate = useNavigate()
  async function handleLogout() { await logout(); navigate('/login', { replace: true }) }
  const dateCard = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long' }).format(new Date())
  return <div className="dashboard-page page-shell"><DashboardHeader displayName={displayName} onLogout={handleLogout} /><main className="dashboard-main"><h2>Dashboard</h2><section className="dashboard-grid" aria-label="Dashboard navigation"><Link className="dash-tile dash-tile--checkin" to="/daily-checkin">Daily Check-in</Link><div className="dash-date">{dateCard}</div><Link className="dash-tile dash-tile--grounding" to="/grounding">Grounding Tools</Link><Link className="dash-tile dash-tile--conflict" to="/conflict">Conflict De-escalation</Link><Link className="dash-tile dash-tile--micro" to="/microskills">Relationship Microskills</Link><Link className="dash-tile dash-tile--resources" to="/resources">Resources</Link><Link className="dash-tile dash-tile--sos" to="/help">SOS</Link></section></main><QuickExit /></div>
}
