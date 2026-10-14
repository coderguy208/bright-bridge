import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/layout/SharedUI.jsx'
import usePageTitle from '../lib/usePageTitle.js'
function ClockHeader() { const now = new Date(); return <header className="demo-header"><span>{now.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span><span>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></header> }
export function BrandArt() { return <aside className="auth-art"><BrandLogo /><em>Bridging Connections</em></aside> }
export default function LandingPage() { usePageTitle('Welcome'); return <div className="demo-page"><ClockHeader /><main className="auth-shell"><section className="auth-left welcome-left"><p>welcome to</p><h1>BrightBridge</h1><Link className="auth-pill" to="/signup">SIGN UP</Link><i>or</i><Link className="auth-pill" to="/login">LOG IN</Link><small>Demo mode: not secure</small></section><BrandArt /></main></div> }
