import { Link } from 'react-router-dom'
import './Landing.css'

function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-badge">Multi-Agent AI Interview</div>
        <h1 className="hero-title">
          Welcome to <span className="highlight">The Bench</span>
        </h1>
        <p className="hero-subtitle">
          Three AI agents. Three different models. One candidate.
          <br />
          Each agent conducts its own interview round, then delivers a hiring verdict.
        </p>
        <div className="hero-actions">
          <Link to="/interview" className="btn btn-primary">
            Start the Interview
          </Link>
          <Link to="/how-it-works" className="btn btn-secondary">
            How This Was Made
          </Link>
        </div>
      </section>

      <section className="agents-preview">
        <h2 className="section-title">The Interview Panel</h2>
        <div className="agents-grid">
          <div className="agent-card architect">
            <div className="agent-indicator"></div>
            <div className="agent-model">Claude Sonnet 4.5 &middot; Anthropic</div>
            <h3>The Architect</h3>
            <p>
              Assesses technical depth, system design thinking, and your ability
              to direct AI agents to build real production systems.
            </p>
          </div>
          <div className="agent-card operator">
            <div className="agent-indicator"></div>
            <div className="agent-model">GPT-4o &middot; OpenAI</div>
            <h3>The Operator</h3>
            <p>
              Tests your practical ability to run AI agents day-to-day &mdash;
              shipping product, managing quality, and handling the real-world
              messiness of AI-assisted development.
            </p>
          </div>
          <div className="agent-card culture">
            <div className="agent-indicator"></div>
            <div className="agent-model">Gemini 2.0 Flash &middot; Google</div>
            <h3>The Culture Lead</h3>
            <p>
              Explores your alignment with a fast-moving startup, your genuine
              passion for the AI shift, and whether you'd thrive in a small,
              intense, supportive team.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2 className="section-title">The Candidate</h2>
        <div className="about-card">
          <div className="about-content">
            <p className="about-lead">
              I'm Rusty &mdash; and this app is my application.
            </p>
            <p>
              I spent 10 years working with Ross Gangemi and Michael Pascoe across
              Olikka and Accenture. I watched them build a company from scratch,
              grow it to 50+ people, land CRN Fast50 twice, and exit to Accenture
              in 2020. I was there for the whole ride.
            </p>
            <p>
              Now they're building again, and I want to be part of what comes next.
              Not because of nostalgia &mdash; because I've seen what they're capable of,
              and this time the tools are different. AI agents aren't replacing
              developers. They're replacing the way development works. And I want
              to be at the front of that shift, with people I trust.
            </p>
            <p>
              This app wasn't written by me line by line. It was architected by me
              and built by three different AI models working together &mdash; exactly
              the workflow the role demands. The app <em>is</em> the proof.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
