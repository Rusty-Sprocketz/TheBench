import { useState, useEffect } from 'react'
import './DeployedApp.css'

function DeployedApp({ url, deployedAt, totalDuration, projectName, sourceFiles, onStartOver, onClear }) {
  const [countdown, setCountdown] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!deployedAt) return

    const expiresAt = deployedAt + 60 * 60 * 1000 // 1 hour
    const interval = setInterval(() => {
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        setCountdown('0:00')
        setExpired(true)
        clearInterval(interval)
        return
      }
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [deployedAt])

  const [showSource, setShowSource] = useState(false)

  return (
    <div className="deployed-app">
      <div className="deployed-app__success">
        SUCCESS — {totalDuration} total
      </div>

      <div className="deployed-app__url-row">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="deployed-app__url"
        >
          {url.replace('https://', '')}
        </a>
        {!expired && <span className="deployed-app__status-badge">LIVE</span>}
        {expired && <span className="deployed-app__status-badge deployed-app__status-badge--expired">EXPIRED</span>}
      </div>

      <div className="deployed-app__actions">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="deployed-app__btn deployed-app__btn--primary"
        >
          Open App
        </a>

        {sourceFiles && (
          <button
            className="deployed-app__btn deployed-app__btn--secondary"
            onClick={() => setShowSource(!showSource)}
          >
            {showSource ? 'Hide Source' : 'View Source Files'}
          </button>
        )}

        <button
          className="deployed-app__btn deployed-app__btn--secondary"
          onClick={onStartOver}
        >
          Start Over
        </button>

        <button
          className="deployed-app__btn deployed-app__btn--ghost"
          onClick={onClear}
        >
          Clear
        </button>
      </div>

      {!expired && (
        <div className="deployed-app__countdown">
          Self-destructs in: {countdown}
        </div>
      )}

      {showSource && sourceFiles && (
        <div className="deployed-app__source">
          {Object.entries(sourceFiles).map(([filename, content]) => (
            <details key={filename} className="deployed-app__source-file">
              <summary>{filename}</summary>
              <pre><code>{content}</code></pre>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

export default DeployedApp
