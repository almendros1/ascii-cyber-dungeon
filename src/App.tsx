import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="terminal-frame" aria-labelledby="terminal-title">
        <header className="terminal-header">
          <div className="terminal-brand">
            <span className="session-light" aria-hidden="true" />
            <div>
              <p className="terminal-kicker">ACD // LOCAL TERMINAL</p>
              <h1 id="terminal-title">ASCII CYBER DUNGEON</h1>
            </div>
          </div>

          <dl className="session-details" aria-label="Session status">
            <div>
              <dt>SESSION</dt>
              <dd>LOCAL</dd>
            </div>
            <div>
              <dt>SYSTEM</dt>
              <dd>CORRUPTED</dd>
            </div>
            <div>
              <dt>LINK</dt>
              <dd>STANDBY</dd>
            </div>
          </dl>
        </header>

        <section className="terminal-output" aria-label="Terminal output">
          <p className="output-line output-line--title">
            ASCII CYBER DUNGEON // TERMINAL PROTOTYPE
          </p>
          <p className="output-line">
            <span className="output-tag">[SYSTEM]</span> Local simulation
            interface ready.
          </p>
          <p className="output-line">
            <span className="output-tag output-tag--warning">[NOTICE]</span>{' '}
            Command processing is not available in this prototype.
          </p>
          <p className="output-line">
            <span className="output-tag">[SAFETY]</span> Input remains inside
            this page and is never executed by your computer.
          </p>
          <p className="output-line output-line--muted">
            Visual channel open. Awaiting command engine installation...
          </p>
        </section>

        <footer className="terminal-command-line">
          <span className="terminal-prompt" aria-hidden="true">
            operator@acd:~$
          </span>
          <span className="input-indicator" aria-hidden="true" />
          <label className="visually-hidden" htmlFor="terminal-input">
            Terminal command input
          </label>
          {/* Command handling intentionally begins in Milestone 2. */}
          <input
            className="terminal-input"
            id="terminal-input"
            name="terminal-input"
            type="text"
            autoComplete="off"
            spellCheck="false"
            aria-describedby="terminal-input-description"
          />
          <span
            className="visually-hidden"
            id="terminal-input-description"
          >
            Visual prototype only. Commands are not processed yet.
          </span>
        </footer>
      </section>
    </main>
  )
}

export default App
