import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Sprout, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { loginWeb } from '../services/api';

export function Login() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await loginWeb(email, password);
      localStorage.setItem('haivoly_web_token', res.access_token);
      nav('/');
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('auth.identifiantsInvalides'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F8FAF8', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ background: '#2E7D32', borderRadius: 20, padding: 24, color: 'white', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
            <Sprout size={26} color="white" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6 }}>{t('auth.titre')}</div>
          <div style={{ opacity: 0.9, fontSize: 13, fontWeight: 500 }}>{t('auth.sousTitre')}</div>
        </div>

        <form onSubmit={handle} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4 }}>{t('auth.formTitre')}</div>
            <div style={{ fontSize: 13, color: '#667085' }}>{t('auth.formSousTitre')}</div>
          </div>

          {err && <div style={{ background: '#FEF3F2', border: '1px solid #FDA29B', color: '#912018', padding: 10, borderRadius: 12, fontSize: 13 }}>{err}</div>}

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>{t('auth.email')}</label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <Mail size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@haivoly.mg" style={{ paddingLeft: 34 }} required />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>{t('auth.motDePasse')}</label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <Lock size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
              <input className="input" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingLeft: 34, paddingRight: 36 }} required />
              <button type="button" onClick={() => setShow((v) => !v)} style={{ position: 'absolute', right: 8, top: 7, background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                {show ? <EyeOff size={16} color="#667085" /> : <Eye size={16} color="#667085" />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
            <LogIn size={16} /> {loading ? t('auth.connexion') : t('auth.seConnecter')}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#667085' }}>
            {t('auth.pasEncoreCompte')}{' '}
            <a href="/register" style={{ color: '#2E7D32', fontWeight: 600, textDecoration: 'none' }}>
              {t('auth.sInscrire')}
            </a>
          </div>

        </form>
      </div>
    </div>
  );
}
