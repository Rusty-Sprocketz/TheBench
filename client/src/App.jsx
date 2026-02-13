import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Landing from './pages/Landing'
import Interview from './pages/Interview'
import HowItWorks from './pages/HowItWorks'
import AgentOps from './pages/AgentOps'
import './App.css'

function App() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/agentops" element={<AgentOps />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>The Bench v2.6.0</span>
      </footer>
    </>
  )
}

export default App
