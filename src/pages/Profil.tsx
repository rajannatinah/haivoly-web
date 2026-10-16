import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  Phone,
  AtSign,
  ShieldCheck,
  Clock3,
  Save,
  CircleCheck,
  Languages,
  KeyRound,
  Settings,
} from 'lucide-react';

import {
  getProfil,
  updateProfil,
  type ProfilUtilisateur,
  type UpdateProfilPayload,
} from '../services/api';
import { ErreurBloc, messageErreur } from '../components/ui/ErrorState';
import { FiltreSegmente } from '../components/ui/FiltreSegmente';

/** Langues proposées, alignées sur la contrainte backend (fr, en, mg). */
const LANGUES = [
  { value: 'fr', label: 'langue.fr' },
  { value: 'mg', label: 'langue.mg' },
  { value: 'en', label: 'langue.en' },
] as const;

type Onglet = 'profil' | 'parametres';

/** Champ de formulaire étiqueté, avec icône positionnée dans l'entrée. */
function Champ({
  etiquette,
  icone,
  valeur,
  onChange,
  aide,
  type = 'text',
  requis = false,
}: {
  etiquette: string;
  icone: React.ReactNode;
  valeur: string;
  onChange: (valeur: string) => void;
  aide?: string;
  type?: string;
  requis?: boolean;
}) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>
        {etiquette} {requis && <span style={{ color: '#D92D20' }}>*</span>}
      </label>
      <div style={{ position: 'relative', marginTop: 6 }}>
        <span style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }}>{icone}</span>
        <input
          className="input"
          type={type}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingLeft: 34 }}
          required={requis}
        />
      </div>
      {aide && <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 4 }}>{aide}</div>}
    </div>
  );
}

function formateDate(valeur: string): string {
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
}

/**
 * Page Profil (lot 9) : accessible depuis le menu utilisateur de la barre du
 * haut, avec deux onglets — « Profil » (identité et coordonnées) et
 * « Paramètres » (préférences de langue, alertes de compte). L'onglet est
 * partageable par URL (`/profil?tab=parametres`).
 */
export function Profil() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const onglet: Onglet = params.get('tab') === 'parametres' ? 'parametres' : 'profil';

  const [profil, setProfil] = useState<ProfilUtilisateur | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [succes, setSucces] = useState<string | null>(null);
  const [erreurForm, setErreurForm] = useState<string | null>(null);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [username, setUsername] = useState('');
  const [langue, setLangue] = useState('fr');

  const charge = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const profilCharge = await getProfil();
      setProfil(profilCharge);
      setNom(profilCharge.nom ?? '');
      setPrenom(profilCharge.prenom ?? '');
      setTelephone(profilCharge.telephone ?? '');
      setUsername(profilCharge.username ?? '');
      setLangue(profilCharge.langue ?? 'fr');
    } catch (e) {
      setProfil(null);
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charge();
  }, [charge]);

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnregistrement(true);
    setSucces(null);
    setErreurForm(null);
    try {
      const payload: UpdateProfilPayload = {
        prenom: prenom.trim(),
        telephone: telephone.trim(),
        langue,
      };
      if (nom.trim().length >= 2) payload.nom = nom.trim();
      if (username.trim()) payload.username = username.trim();

      const maj = await updateProfil(payload);
      setProfil(maj);
      setNom(maj.nom ?? '');
      setPrenom(maj.prenom ?? '');
      setTelephone(maj.telephone ?? '');
      setUsername(maj.username ?? '');
      setLangue(maj.langue ?? 'fr');
      setSucces(t('profil.enregistre'));
    } catch (e) {
      setErreurForm(messageErreur(e));
    } finally {
      setEnregistrement(false);
    }
  };

  if (chargement) {
    return (
      <div className="card" style={{ padding: 20, color: '#667085', fontSize: 13 }}>
        {t('commun.etats.chargement')}
      </div>
    );
  }

  if (erreur) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
          {t('profil.titre')}
        </h1>
        <p style={{ color: '#667085', fontSize: 13, margin: 0 }}>{t('profil.erreurChargement')}</p>
        <ErreurBloc erreur={erreur} onRetry={() => void charge()} />
      </div>
    );
  }

  if (!profil) return null;

  const estProprietaire = profil.role === 'PROPRIETAIRE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>{t('profil.titre')}</h1>
        <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>{t('profil.sousTitre')}</p>
      </div>

      <FiltreSegmente<Onglet>
        ariaLabel={t('profil.ongletsAria')}
        idTest="onglets-profil"
        valeur={onglet}
        onChange={(v) => setParams(v === 'parametres' ? { tab: 'parametres' } : {}, { replace: true })}
        options={[
          { valeur: 'profil', libelle: t('profil.ongletProfil'), icone: <User size={15} /> },
          { valeur: 'parametres', libelle: t('profil.ongletParametres'), icone: <Settings size={15} /> },
        ]}
      />

      {onglet === 'profil' ? (
        <div className="card" style={{ padding: 18, display: 'flex', flexWrap: 'wrap', gap: 16 }} data-testid="profil-apercu">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475467' }}>
            <Mail size={16} color="#98A2B3" />
            <span style={{ fontWeight: 600 }}>{t('profil.email')} :</span>
            <span>{profil.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475467' }}>
            <ShieldCheck size={16} color="#98A2B3" />
            <span style={{ fontWeight: 600 }}>{t('profil.role')} :</span>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: estProprietaire ? '#f4f3ff' : '#eff8ff',
                color: estProprietaire ? '#5925dc' : '#175cd3',
              }}
            >
              {profil.role}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475467' }}>
            {profil.estVerifie ? <ShieldCheck size={16} color="#027a48" /> : <Clock3 size={16} color="#b54708" />}
            <span style={{ fontWeight: 600 }}>{t('profil.statut')} :</span>
            <span style={{ color: profil.estVerifie ? '#027a48' : '#b54708' }}>
              {profil.estVerifie ? t('profil.actif') : t('profil.enAttente')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475467' }}>
            <span style={{ fontWeight: 600 }}>{t('profil.membreDepuis')} :</span>
            <span>{formateDate(profil.creeA)}</span>
          </div>
        </div>
      ) : (
        profil.motDePasseProvisoire && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 12,
              borderRadius: 12,
              border: '1px solid #FEDF89',
              background: '#FFFAEB',
              color: '#B54708',
              fontSize: 13,
            }}
          >
            <KeyRound size={16} />
            {t('profil.motDePasseProvisoire')}
          </div>
        )
      )}

      <form className="card" onSubmit={enregistrer} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {onglet === 'profil' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={16} color="#2E7D32" />
              <span style={{ fontWeight: 800, fontSize: 15 }}>{t('profil.sectionIdentite')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <Champ etiquette={t('profil.nom')} icone={<User size={16} />} valeur={nom} onChange={setNom} requis />
              <Champ etiquette={t('profil.prenom')} icone={<User size={16} />} valeur={prenom} onChange={setPrenom} />
              <Champ
                etiquette={t('profil.username')}
                icone={<AtSign size={16} />}
                valeur={username}
                onChange={(v) => setUsername(v.toLowerCase())}
                aide={t('profil.usernameAide')}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Phone size={16} color="#2E7D32" />
              <span style={{ fontWeight: 800, fontSize: 15 }}>{t('profil.sectionContact')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <Champ etiquette={t('profil.telephone')} icone={<Phone size={16} />} valeur={telephone} onChange={setTelephone} />
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>{t('profil.email')}</label>
                <div style={{ position: 'relative', marginTop: 6 }}>
                  <Mail size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
                  <input className="input" value={profil.email} readOnly disabled style={{ paddingLeft: 34 }} />
                </div>
                <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 4 }}>{t('profil.emailAide')}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Languages size={16} color="#2E7D32" />
              <span style={{ fontWeight: 800, fontSize: 15 }}>{t('profil.sectionPreferences')}</span>
            </div>

            <div style={{ maxWidth: 260 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>{t('profil.langue')}</label>
              <select className="input" value={langue} onChange={(e) => setLangue(e.target.value)} style={{ marginTop: 6 }}>
                {LANGUES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {t(l.label)}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {succes && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#ECFDF3',
              border: '1px solid #A6F4C5',
              color: '#065F46',
              padding: 10,
              borderRadius: 12,
              fontSize: 13,
            }}
          >
            <CircleCheck size={16} />
            {succes}
          </div>
        )}

        {erreurForm && (
          <div
            role="alert"
            style={{
              background: '#FEF3F2',
              border: '1px solid #FDA29B',
              color: '#912018',
              padding: 10,
              borderRadius: 12,
              fontSize: 13,
            }}
          >
            {erreurForm}
          </div>
        )}

        <div>
          <button type="submit" className="btn btn-primary" disabled={enregistrement}>
            <Save size={16} /> {enregistrement ? t('profil.enregistrement') : t('profil.enregistrer')}
          </button>
        </div>
      </form>
    </div>
  );
}
