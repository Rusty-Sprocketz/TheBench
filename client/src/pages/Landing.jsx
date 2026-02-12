import { Link } from 'react-router-dom'
import './Landing.css'

function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <p className="hero-tagline">You said don&rsquo;t send a CV. So I built this instead.</p>
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
              I've spent the last decade working alongside Ross Gangemi and Michael
              Pascoe &mdash; first at Olikka, the boutique Melbourne systems integrator
              I joined in 2014, and then at Accenture after the acquisition in 2020.
              Across 25+ engagements I led workplace strategy and transformation
              programs specialising in M365, modern workplace, end-user experience,
              and endpoint management. Most recently at Arinco, I led the delivery
              of a global Intune endpoint management solution for PEXA&rsquo;s 2,000 staff
              and am currently leading a tenant migration and Intune rollout at TAC.
              My job has never been just the technology &mdash; it&rsquo;s understanding how
              people actually work with it, then designing solutions that meet them
              where they are. Self-service SOE platforms, EUX monitoring dashboards
              with auto-healing, global device management &mdash; tools built around the
              human, not the other way around.
            </p>
            <p>
              That background is exactly why AI-agent development makes sense as my
              next step. Directing an AI agent well requires the same instinct I've
              been sharpening for years: empathy for the end user, clarity about the
              outcome, and the discipline to design a workflow instead of just
              executing tasks. The bridge between &ldquo;designing better employee
              experiences&rdquo; and &ldquo;directing AI agents to ship product&rdquo;
              is shorter than it looks &mdash; both demand someone who thinks in systems,
              communicates intent precisely, and cares about the quality of what gets
              delivered.
            </p>
            <p>
              This app wasn't written by me line by line. It was architected by me
              and built by three different AI models working together &mdash; exactly
              the workflow the role demands. Ross and Michael are building again,
              and I want to be part of what comes next. Not out of nostalgia, but
              because I've seen first-hand what they're capable of, I trust how they
              operate, and this time the tools are different. The app <em>is</em> the proof
              &mdash; and I'd love the chance to keep proving it.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
