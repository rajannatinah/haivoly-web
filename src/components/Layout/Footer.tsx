export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #EAECF0', background: 'white', marginTop: 32 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#98A2B3' }}>
        <span>© {new Date().getFullYear()} Haivoly — Suivi des actions mobiles • Antananarivo</span>
        <span>Offline-first • Sync • Recommandations → Mobile</span>
      </div>
    </footer>
  );
}
