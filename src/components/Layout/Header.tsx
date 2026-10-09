import { NavLink, useNavigate } from 'react-router-dom';
import { Sprout, LogOut, Bell } from 'lucide-react';

export function Header() {
  const nav = useNavigate();
  const logout = () => {
    localStorage.removeItem('haivoly_web_token');
    nav('/login');
  };
  return (
    <header style={{ background: 'white', borderBottom: '1px solid #EAECF0', position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sprout size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, letterSpacing: -0.4, lineHeight: 1 }}>Haivoly</div>
              <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Suivi & Dashboard</div>
            </div>
            <span className="badge badge-primary" style={{ marginLeft: 6 }}>Web</span>
          </div>
          <nav style={{ display: 'flex', gap: 6, marginLeft: 18 }}>
            <NavLink to="/" end style={({ isActive }) => ({ padding: '7px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: isActive ? '#EDF7ED' : 'transparent', color: isActive ? '#1B4E1F' : '#344054', border: isActive ? '1px solid #ABEFC6' : '1px solid transparent' })}>
              Dashboard
            </NavLink>
            <NavLink to="/actions" style={({ isActive }) => ({ padding: '7px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: isActive ? '#EDF7ED' : 'transparent', color: isActive ? '#1B4E1F' : '#344054', border: isActive ? '1px solid #ABEFC6' : '1px solid transparent' })}>
              Actions
            </NavLink>
            <NavLink to="/recommandations" style={({ isActive }) => ({ padding: '7px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: isActive ? '#EDF7ED' : 'transparent', color: isActive ? '#1B4E1F' : '#344054', border: isActive ? '1px solid #ABEFC6' : '1px solid transparent' })}>
              Recommandations
            </NavLink>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-ghost" style={{ padding: 8 }} aria-label="Notifications">
            <Bell size={18} />
          </button>
          <button onClick={logout} className="btn btn-outline" style={{ padding: '8px 12px', fontSize: 13 }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
