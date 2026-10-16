import { useState, type SyntheticEvent } from 'react';
import logoHaivoly from '../../assets/logo-haivoly.png';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';

import { loginWeb, registerWeb } from '../../services/api';
import './auth-switch.css';

type SignupRole = 'PROPRIETAIRE' | 'AGRICULTEUR';

interface SignupForm {
  nom: string;
  prenom: string;
  email: string;
  username: string;
  telephone: string;
  langue: string;
  role: SignupRole;
  password: string;
  confirmPassword: string;
}

function messageFromError(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;

  const candidate = error as {
    message?: unknown;
    response?: {
      data?: {
        message?: unknown;
        error?: unknown;
      };
    };
  };
  const apiMessage = candidate.response?.data?.message ?? candidate.response?.data?.error;

  if (typeof apiMessage === 'string') return apiMessage;
  if (Array.isArray(apiMessage)) {
    const messages = apiMessage.filter((item): item is string => typeof item === 'string');
    if (messages.length) return messages.join(', ');
  }
  return typeof candidate.message === 'string' ? candidate.message : undefined;
}

export default function AuthSwitch() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isSignUp = location.pathname.replace(/\/$/, '') === '/register';

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [signup, setSignup] = useState<SignupForm>({
    nom: '',
    prenom: '',
    email: '',
    username: '',
    telephone: '',
    langue: 'fr',
    role: 'PROPRIETAIRE',
    password: '',
    confirmPassword: '',
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const setSignupField = <K extends keyof SignupForm>(field: K, value: SignupForm[K]) => {
    setSignup((current) => ({ ...current, [field]: value }));
  };

  const switchMode = (nextIsSignUp: boolean) => {
    setLoginError('');
    setSignupError('');
    if (nextIsSignUp) setSignupSuccess('');
    void navigate(nextIsSignUp ? '/register' : '/login');
  };

  const submitLogin = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await loginWeb(loginEmail.trim().toLowerCase(), loginPassword);
      localStorage.setItem('haivoly_web_token', response.access_token);
      void navigate('/', { replace: true });
    } catch (error: unknown) {
      setLoginError(messageFromError(error) || t('auth.identifiantsInvalides'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const submitSignup = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    if (signup.password !== signup.confirmPassword) {
      setSignupError(t('auth.mdpIncoherent'));
      return;
    }
    if (signup.password.length < 8) {
      setSignupError(t('auth.mdpTropCourt'));
      return;
    }

    setIsRegistering(true);
    try {
      const response = await registerWeb({
        nom: signup.nom.trim(),
        prenom: signup.prenom.trim() || undefined,
        email: signup.email.trim().toLowerCase(),
        username: signup.username.trim() || undefined,
        telephone: signup.telephone.trim() || undefined,
        langue: signup.langue,
        role: signup.role,
        password: signup.password,
      });

      setSignupSuccess(
        typeof response?.message === 'string' && response.message
          ? response.message
          : t('auth.compteCree'),
      );
    } catch (error: unknown) {
      setSignupError(messageFromError(error) || t('auth.erreurInscription'));
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <main className="auth-switch">
      <div className="auth-switch__ambient auth-switch__ambient--one" aria-hidden="true" />
      <div className="auth-switch__ambient auth-switch__ambient--two" aria-hidden="true" />

      <section
        className={`auth-switch__card${isSignUp ? ' is-sign-up' : ''}`}
        aria-label={t('auth.titre')}
      >
        <div className="auth-switch__forms-container">
          <div className="auth-switch__signin-signup">
            {/* ── LOGIN FORM (unchanged) ── */}
            <form
              className="auth-switch__form auth-switch__form--sign-in"
              onSubmit={submitLogin}
              aria-hidden={isSignUp}
            >
              <div className="auth-switch__form-content">
                <h1 className="auth-switch__title">{t('auth.formTitre')}</h1>
                <p className="auth-switch__form-description">{t('auth.formSousTitre')}</p>

                {loginError && (
                  <div className="auth-switch__notice auth-switch__notice--error" role="alert">
                    <AlertCircle size={18} aria-hidden="true" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="auth-switch__field">
                  <label htmlFor="haivoly-login-email">{t('auth.email')}</label>
                  <div className="auth-switch__input-wrap">
                    <Mail size={18} aria-hidden="true" />
                    <input
                      id="haivoly-login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      placeholder="admin@haivoly.mg"
                      required
                      disabled={isLoggingIn}
                    />
                  </div>
                </div>

                <div className="auth-switch__field">
                  <label htmlFor="haivoly-login-password">{t('auth.motDePasse')}</label>
                  <div className="auth-switch__input-wrap">
                    <Lock size={18} aria-hidden="true" />
                    <input
                      id="haivoly-login-password"
                      name="password"
                      type={showLoginPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoggingIn}
                    />
                    <button
                      className="auth-switch__reveal"
                      type="button"
                      onClick={() => setShowLoginPassword((visible) => !visible)}
                      aria-label={t(showLoginPassword ? 'auth.masquerMotDePasse' : 'auth.afficherMotDePasse')}
                      disabled={isLoggingIn}
                    >
                      {showLoginPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button className="auth-switch__submit" type="submit" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <Loader2 className="auth-switch__spinner" size={18} aria-hidden="true" />
                  ) : (
                    <LogIn size={18} aria-hidden="true" />
                  )}
                  <span>{isLoggingIn ? t('auth.connexion') : t('auth.seConnecter')}</span>
                  {!isLoggingIn && <ArrowRight size={17} aria-hidden="true" />}
                </button>

                <p className="auth-switch__form-footnote">
                  {t('auth.pasEncoreCompte')}{' '}
                  <button type="button" onClick={() => switchMode(true)}>
                    {t('auth.sInscrire')}
                  </button>
                </p>
              </div>
            </form>

            {/* ── SIGNUP FORM (spacing improved) ── */}
            <form
              className="auth-switch__form auth-switch__form--sign-up "
              onSubmit={submitSignup}
              aria-hidden={!isSignUp}
            >
              <div className="auth-switch__form-content auth-switch__form-content--signup">
                <h1 className="auth-switch__title auth-switch__title--signup">{t('auth.inscription')}</h1>
                <p className="auth-switch__form-description">{t('auth.inscriptionSousTitre')}</p>

                {signupError && (
                  <div className="auth-switch__notice auth-switch__notice--error" role="alert">
                    <AlertCircle size={18} aria-hidden="true" />
                    <span>{signupError}</span>
                  </div>
                )}
                {signupSuccess && (
                  <output className="auth-switch__notice auth-switch__notice--success">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <span>{signupSuccess}</span>
                    <button type="button" onClick={() => switchMode(false)}>
                      {t('auth.seConnecter')}
                    </button>
                  </output>
                )}

                {/* ── Nom / Prénom ── */}
                <div className="auth-switch__field-grid">
                  <div className="auth-switch__field">
                    <label htmlFor="haivoly-signup-nom">
                      {t('auth.nom')} <span className="auth-switch__required" aria-hidden="true">*</span>
                    </label>
                    <div className="auth-switch__input-wrap">
                      <User size={17} aria-hidden="true" />
                      <input
                        id="haivoly-signup-nom"
                        name="nom"
                        autoComplete="family-name"
                        value={signup.nom}
                        onChange={(event) => setSignupField('nom', event.target.value)}
                        placeholder={t('auth.nomPlaceholder')}
                        required
                        disabled={isRegistering}
                      />
                    </div>
                  </div>
                  <div className="auth-switch__field">
                    <label htmlFor="haivoly-signup-prenom">{t('auth.prenom')}</label>
                    <div className="auth-switch__input-wrap">
                      <User size={17} aria-hidden="true" />
                      <input
                        id="haivoly-signup-prenom"
                        name="prenom"
                        autoComplete="given-name"
                        value={signup.prenom}
                        onChange={(event) => setSignupField('prenom', event.target.value)}
                        placeholder={t('auth.prenomPlaceholder')}
                        disabled={isRegistering}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Email / Username ── */}
                <div className="auth-switch__field-grid">
                  <div className="auth-switch__field">
                    <label htmlFor="haivoly-signup-email">
                      {t('auth.email')} <span className="auth-switch__required" aria-hidden="true">*</span>
                    </label>
                    <div className="auth-switch__input-wrap">
                      <Mail size={17} aria-hidden="true" />
                      <input
                        id="haivoly-signup-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        value={signup.email}
                        onChange={(event) => setSignupField('email', event.target.value)}
                        placeholder={t('auth.emailPlaceholder')}
                        required
                        disabled={isRegistering}
                      />
                    </div>
                  </div>
                  <div className="auth-switch__field">
                    <label htmlFor="haivoly-signup-username">{t('auth.nomUtilisateur')}</label>
                    <div className="auth-switch__input-wrap">
                      <User size={17} aria-hidden="true" />
                      <input
                        id="haivoly-signup-username"
                        name="username"
                        autoComplete="username"
                        value={signup.username}
                        onChange={(event) => setSignupField('username', event.target.value.toLowerCase())}
                        placeholder={t('auth.usernamePlaceholder')}
                        disabled={isRegistering}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Téléphone / Rôle ── */}
                <div className="auth-switch__field-grid">
                  <div className="auth-switch__field">
                    <label htmlFor="haivoly-signup-phone">{t('auth.telephone')}</label>
                    <div className="auth-switch__input-wrap">
                      <Phone size={17} aria-hidden="true" />
                      <input
                        id="haivoly-signup-phone"
                        name="telephone"
                        type="tel"
                        autoComplete="tel"
                        value={signup.telephone}
                        onChange={(event) => setSignupField('telephone', event.target.value)}
                        placeholder={t('auth.telephonePlaceholder')}
                        disabled={isRegistering}
                      />
                    </div>
                  </div>
                  <div className="auth-switch__field">
                    <label htmlFor="haivoly-signup-role">{t('auth.role')}</label>
                    <div className="auth-switch__input-wrap auth-switch__input-wrap--select">
                      <ShieldCheck size={17} aria-hidden="true" />
                      <select
                        id="haivoly-signup-role"
                        name="role"
                        value={signup.role}
                        onChange={(event) => setSignupField('role', event.target.value as SignupRole)}
                        disabled={isRegistering}
                      >
                        <option value="PROPRIETAIRE">{t('auth.proprietaire')}</option>
                        <option value="AGRICULTEUR">{t('auth.agriculteur')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ── Langue / Mot de passe ── */}
                <div className="auth-switch__field-grid">
                  <div className="auth-switch__field">
                    <label htmlFor="haivoly-signup-language">{t('auth.langue')}</label>
                    <div className="auth-switch__input-wrap auth-switch__input-wrap--select">
                      <Globe2 size={17} aria-hidden="true" />
                      <select
                        id="haivoly-signup-language"
                        name="langue"
                        value={signup.langue}
                        onChange={(event) => setSignupField('langue', event.target.value)}
                        disabled={isRegistering}
                      >
                        <option value="fr">{t('langue.fr')}</option>
                        <option value="mg">{t('langue.mg')}</option>
                        <option value="en">{t('langue.en')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="auth-switch__field">
                    <label htmlFor="haivoly-signup-password">
                      {t('auth.motDePasse')} <span className="auth-switch__required" aria-hidden="true">*</span>
                    </label>
                    <div className="auth-switch__input-wrap">
                      <Lock size={17} aria-hidden="true" />
                      <input
                        id="haivoly-signup-password"
                        name="password"
                        type={showSignupPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={signup.password}
                        onChange={(event) => setSignupField('password', event.target.value)}
                        placeholder="••••••••"
                        minLength={8}
                        required
                        disabled={isRegistering}
                      />
                      <button
                        className="auth-switch__reveal"
                        type="button"
                        onClick={() => setShowSignupPassword((visible) => !visible)}
                        aria-label={t(showSignupPassword ? 'auth.masquerMotDePasse' : 'auth.afficherMotDePasse')}
                        disabled={isRegistering}
                      >
                        {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Confirmer mot de passe ── */}
                <div className="auth-switch__field">
                  <label htmlFor="haivoly-signup-confirm-password">
                    {t('auth.confirmerMotDePasse')} <span className="auth-switch__required" aria-hidden="true">*</span>
                  </label>
                  <div className="auth-switch__input-wrap">
                    <Lock size={17} aria-hidden="true" />
                    <input
                      id="haivoly-signup-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={signup.confirmPassword}
                      onChange={(event) => setSignupField('confirmPassword', event.target.value)}
                      placeholder="••••••••"
                      minLength={8}
                      required
                      disabled={isRegistering}
                    />
                    <button
                      className="auth-switch__reveal"
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      aria-label={t(showConfirmPassword ? 'auth.masquerMotDePasse' : 'auth.afficherMotDePasse')}
                      disabled={isRegistering}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <p className="auth-switch__password-hint">{t('auth.mdpMin')}</p>

                <button
                  className="auth-switch__submit auth-switch__submit--signup"
                  type="submit"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <Loader2 className="auth-switch__spinner" size={18} aria-hidden="true" />
                  ) : (
                    <UserPlus size={18} aria-hidden="true" />
                  )}
                  <span>{isRegistering ? `${t('auth.inscription')}…` : t('auth.sInscrire')}</span>
                  {!isRegistering && <ArrowRight size={17} aria-hidden="true" />}
                </button>

                <p className="auth-switch__form-footnote">
                  {t('auth.dejaCompte')}{' '}
                  <button type="button" onClick={() => switchMode(false)}>
                    {t('auth.seConnecter')}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="auth-switch__panels-container">
          <section className="auth-switch__panel auth-switch__panel--left" aria-label={t('auth.titre')}>
            <div className="auth-switch__panel-content auth-switch__panel-content--left">
              <span className="auth-switch__panel-emblem auth-switch__panel-emblem--logo" aria-hidden="true">
                <img className="auth-switch__panel-logo" src={logoHaivoly} alt="" />
              </span>
              <span className="auth-switch__panel-soustitre">{t('auth.sousTitre')}</span>
              <h2>{t('auth.nouveauIci')}</h2>
              <p>{t('auth.messageInscription')}</p>
              <button
                className="auth-switch__panel-button"
                type="button"
                onClick={() => switchMode(true)}
                disabled={isLoggingIn || isRegistering}
              >
                {t('auth.creerCompte')}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className="auth-switch__panel auth-switch__panel--right" aria-label={t('auth.titre')}>
            <div className="auth-switch__panel-content auth-switch__panel-content--right">
              <span className="auth-switch__panel-emblem auth-switch__panel-emblem--logo" aria-hidden="true">
                <img className="auth-switch__panel-logo" src={logoHaivoly} alt="" />
              </span>
              <span className="auth-switch__panel-soustitre">{t('auth.sousTitre')}</span>
              <h2>{t('auth.dejaParmiNous')}</h2>
              <p>{t('auth.messageConnexion')}</p>
              <button
                className="auth-switch__panel-button"
                type="button"
                onClick={() => switchMode(false)}
                disabled={isLoggingIn || isRegistering}
              >
                {t('auth.seConnecter')}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}