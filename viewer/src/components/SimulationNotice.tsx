function SimulationNotice() {
  return (
    <div className="simulation-notice" role="note">
      <span className="notice-icon" aria-hidden="true">i</span>
      <span><strong>Simulated data — based on literature and engineering assumptions.</strong><small>No industrial sensors are connected. Values are illustrative and are not validated operating instructions.</small></span>
    </div>
  )
}

export default SimulationNotice
