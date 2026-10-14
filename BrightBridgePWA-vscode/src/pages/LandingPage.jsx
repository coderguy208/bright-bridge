import { Link } from 'react-router-dom'
import { BrandLogo, QuickExit } from '../components/layout/SharedUI.jsx'
import usePageTitle from '../lib/usePageTitle.js'

// LandingPage recreates the original welcome screen without loading auth prematurely.
export default function LandingPage() {
  usePageTitle('Welcome')

  return (
    <div className="landing-page sunset-welcome page-shell">
      <div className="welcome-wave" aria-hidden="true" />
      <main className="welcome-main">
        <div className="icon-container fade-in"><BrandLogo /></div>
        <p className="welcome-kicker">welcome to</p><h1>BrightBridge</h1>
        <div className="welcome-actions"><Link to="/login" className="welcome-button welcome-button--mauve">Daily Check-in</Link><Link to="/login" className="welcome-button">Log In</Link><Link to="/login" className="welcome-button">Sign Up</Link></div>
      </main>
      <QuickExit />
    </div>
  )
}
