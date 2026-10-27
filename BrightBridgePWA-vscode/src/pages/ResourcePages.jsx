import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '../components/layout/SharedUI.jsx'
import { useAuth } from '../features/auth/authContext.js'
import { resourceIcons } from '../utils/resourceIcons.js'

const resourceContent = {
  grounding: <><h2>5-4-3-2-1 senses</h2><p>Name 5 things you see, 4 you can feel, 3 you hear, 2 you smell, and 1 you taste.</p><h2>Box breathing</h2><div className="breathing-circle">4 in · 4 hold · 4 out · 4 hold</div><h2>Body scan</h2><p>Notice your forehead, shoulders, hands, stomach, and feet. Soften one place at a time.</p></>,
  conflict: <><p>Pause before reacting. Lower your voice and name the feeling.</p><ul><li>“I feel overwhelmed. I need a minute.”</li><li>Use “I” statements instead of blame.</li><li>Offer a break: “Can we return to this in ten minutes?”</li><li>Walk away if the conversation becomes unsafe.</li></ul></>,
  microskills: <><p>Active listening means giving your full attention and reflecting back what you heard.</p><ul><li>“It sounds like you felt left out.”</li><li>Ask open questions: “What was that like for you?”</li><li>Give specific compliments: “I appreciated you checking in.”</li><li>Repair: “I’m sorry I snapped. Can we try again?”</li></ul></>,
}

const resourceAliases = {
  grounding: ['grounding', 'grounding-tools'],
  conflict: ['conflict', 'conflict-deescalation', 'conflict-de-escalation', 'conflict-deescalation-tools'],
  microskills: ['microskills', 'relationship-microskills', 'relationship-micro-skills'],
}

const resources = Object.entries(resourceIcons).map(([id, resource]) => ({ id, ...resource, content: resourceContent[id] }))

function findResource(routeId = '') {
  const normalizedId = decodeURIComponent(routeId).trim().toLowerCase()
  return resources.find((resource) => resource.slug.toLowerCase() === normalizedId || resourceAliases[resource.id].includes(normalizedId))
}

export function ResourcesPage() {
  return <Logged><section className="content-card"><Link className="resources-back-button" to="/home">BACK</Link><h1>Resources</h1><p>Choose a small tool that fits what you need right now.</p>{resources.map((resource) => <Link className="resource-list-card" key={resource.id} to={resource.to} state={{ from: '/resources' }}>{resource.alt}</Link>)}</section></Logged>
}

export function ResourceDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const resource = findResource(id)
  const backTo = location.state?.from === '/home' ? '/home' : '/resources'
  return <Logged><section className="content-card"><Link className="back-link" to={backTo}>← Back</Link><h1>{resource?.alt || 'Resource'}</h1>{resource?.content || <p>That resource was not found.</p>}</section></Logged>
}

export function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  function clear() { if (!window.confirm('Clear your saved check-ins and demo accounts?')) return; localStorage.clear(); logout(); navigate('/') }
  return <Logged><section className="content-card"><Link className="back-link" to="/home">← Back</Link><h1>Settings</h1><p><strong>Username:</strong> {user.username}</p><p><strong>Email:</strong> {user.email}</p><button className="purple-button" onClick={() => { logout(); navigate('/') }}>Log out</button><button className="danger-button" onClick={clear}>Clear my demo data</button></section></Logged>
}

function Logged({ children }) { return <div className="logged-page"><AppHeader /><main className="content-shell">{children}</main></div> }
