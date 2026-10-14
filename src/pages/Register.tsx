import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Sprout, Mail, Lock, Eye, EyeOff, User, Phone, UserPlus, ArrowLeft } from 'lucide-react';
import { registerWeb } from '../services/api';

const ROLES = [
  { value: 'PROPRIETAIRE', label: 'Propriétaire' },
  { value: 'AGRICULTEUR', label: 'Agriculteur' },
] as const;

export function Register() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [telephone, setTelephone] = useState('');
  const [langue, setLangue] = useState('fr');
  const [role, setRole] = useState<'PROPRIETAIRE' | 'AGRICULTEUR'>('PROPRIETAIRE');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSuccess('');

    if (password !== confirmPassword) {
      setErr('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setErr('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      const res = await registerWeb({
        nom: nom.trim(),
        prenom: prenom.trim() || undefined,
        email: email.trim().toLowerCase(),
        username: username.trim() || undefined,
        telephone: telephone.trim() || undefined,
        langue,
        role,
        password,
      });

      setSuccess(
        res?.message ||
          'Compte créé. Un email de confirmation vous a été envoyé si requis.',
      );

      setTimeout(() => {
        nav('/login');
      }, 2000);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Erreur lors de l'inscription";
      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#F8FAF8',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div
          style={{
            background: '#2E7D32',
            borderRadius: 20,
            padding: 24,
            color: 'white',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 10px',
            }}
          >
            <Sprout size={26} color="white" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6 }}>
            Haivoly
          </div>
          <div style={{ opacity: 0.9, fontSize: 13, fontWeight: 500 }}>
            {t('auth.creerCompte')}
          </div>
        </div>

        <form
          onSubmit={handle}
          className="card"
          style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4 }}>
                {t('auth.inscription')}
              </div>
              <div style={{ fontSize: 13, color: '#667085' }}>
                Remplissez les informations ci-dessous
              </div>
            </div>
            <Link
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: '#2E7D32',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={14} />
              Retour à la connexion
            </Link>
          </div>

          {err && (
            <div
              style={{
                background: '#FEF3F2',
                border: '1px solid #FDA29B',
                color: '#912018',
                padding: 10,
                borderRadius: 12,
                fontSize: 13,
              }}
            >
              {err}
            </div>
          )}

          {success && (
            <div
              style={{
                background: '#ECFDF3',
                border: '1px solid #A6F4C5',
                color: '#065F46',
                padding: 10,
                borderRadius: 12,
                fontSize: 13,
              }}
            >
              {success}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>
                Nom <span style={{ color: '#D92D20' }}>*</span>
              </label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <User size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
                <input
                  className="input"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="RABE"
                  style={{ paddingLeft: 34 }}
                  required
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>
                Prénom
              </label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <User size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
                <input
                  className="input"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Jean"
                  style={{ paddingLeft: 34 }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>
              Email <span style={{ color: '#D92D20' }}>*</span>
            </label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <Mail size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.rabe@haivoly.mg"
                style={{ paddingLeft: 34 }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>
                Nom d'utilisateur (facultatif)
              </label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="jeanrabe"
                style={{ marginTop: 6 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>
                Téléphone
              </label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <Phone size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
                <input
                  className="input"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+261 34 00 000 00"
                  style={{ paddingLeft: 34 }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>
                Langue
              </label>
              <select
                className="input"
                value={langue}
                onChange={(e) => setLangue(e.target.value)}
                style={{ marginTop: 6 }}
              >
                <option value="fr">Français</option>
                <option value="mg">Malgache</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>
                Rôle
              </label>
              <select
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as 'PROPRIETAIRE' | 'AGRICULTEUR')}
                style={{ marginTop: 6 }}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 4 }}>
                Choisissez le type de compte qui correspond à votre activité.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>
                Mot de passe <span style={{ color: '#D92D20' }}>*</span>
              </label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <Lock size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
                <input
                  className="input"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: 34, paddingRight: 36 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 7,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  {showPwd ? <EyeOff size={16} color="#667085" /> : <Eye size={16} color="#667085" />}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 4 }}>
                Min. 8 caractères, majuscule, minuscule, chiffre
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>
                Confirmer le mot de passe <span style={{ color: '#D92D20' }}>*</span>
              </label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <Lock size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
                <input
                  className="input"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: 34, paddingRight: 36 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 7,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  {showConfirm ? <EyeOff size={16} color="#667085" /> : <Eye size={16} color="#667085" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ justifyContent: 'center', marginTop: 4 }}
          >
            <UserPlus size={16} />
            {loading ? t('auth.inscription') + '…' : t('auth.sInscrire')}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#667085' }}>
            {t('auth.dejaCompte')}{' '}
            <Link to="/login" style={{ color: '#2E7D32', fontWeight: 600, textDecoration: 'none' }}>
              {t('auth.seConnecter')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
