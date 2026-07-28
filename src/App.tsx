import './App.css'
import { TerminalConsole } from './components/TerminalConsole'

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

        <TerminalConsole />
      </section>
    </main>
  )
}

export default App
