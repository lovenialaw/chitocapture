type HeaderProps = {
  timestamp?: string
  page?: 'monitoring' | 'sources' | 'scenario' | 'executive' | 'carbon-flow' | 'reports'
  title?: string
  subtitle?: string
}

function Header({ timestamp, page = 'monitoring', title, subtitle }: HeaderProps) {
  return (
    <header className="app-header">
      <aside className="app-sidebar" aria-label="Main navigation">
        <a className="brand" href="/" aria-label="ChitoCapture home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-word">Chito<span>Capture</span></span>
        </a>
        <span className="sidebar-caption">CARBON CAPTURE</span>
        <nav className="sidebar-nav">
          <a href="/" className={page === 'executive' ? 'active' : ''} aria-current={page === 'executive' ? 'page' : undefined}><span aria-hidden="true">▥</span>Executive Dashboard</a>
          <a href="/?page=process-monitoring" className={page === 'monitoring' ? 'active' : ''} aria-current={page === 'monitoring' ? 'page' : undefined}><span aria-hidden="true">◫</span>Process Monitoring</a>
          <a href="/?page=carbon-flow" className={page === 'carbon-flow' ? 'active' : ''} aria-current={page === 'carbon-flow' ? 'page' : undefined}><span aria-hidden="true">⌁</span>Carbon Flow</a>
          <a href="/?page=scenario-analysis" className={page === 'scenario' ? 'active' : ''} aria-current={page === 'scenario' ? 'page' : undefined}><span aria-hidden="true">⌁</span>Scenario Analysis</a>
          <a href="/?page=data-sources" className={page === 'sources' ? 'active' : ''} aria-current={page === 'sources' ? 'page' : undefined}><span aria-hidden="true">▤</span>Data &amp; Sources</a>
          <a href="/?page=reports" className={page === 'reports' ? 'active' : ''} aria-current={page === 'reports' ? 'page' : undefined}><span aria-hidden="true">▧</span>Reports</a>
        </nav>
        <div className="sidebar-foot"><i /> SIMULATION PROTOTYPE</div>
      </aside>
      <div className="page-heading">
        <h1>{title ?? 'Process Monitoring'}</h1>
        <p>{subtitle ?? 'Live system diagram with real-time process data'}</p>
      </div>
      {timestamp && <div className="header-meta">
        <span className="live-badge"><i />LIVE SIMULATION</span>
        <span className="sim-time"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" /></svg>{timestamp}</span>
      </div>}
    </header>
  )
}

export default Header
