import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, ShieldCheck, ShieldX, Clock3, Eye, CircleUser, UserPlus, Globe2, CircleAlert, CheckCircle2, Loader2, AtSign, Phone, User } from 'lucide-react';
import axios from 'axios';
import { getUtilisateurs, creerUtilisateur, type UtilisateurApercu } from '../services/api';
import { messageErreur } from '../components/ui/ErrorState';
import { TableauDonnees, type Colonne } from '../components/ui/TableauDonnees';
import { PanneauDetail } from '../components/ui/PanneauDetail';
import { Modale } from '../components/ui/Modale';
import { useUtilisateur } from '../components/Layout/UserProvider';

/** Validation simple et lisible d'une adresse e-mail. */
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface ChampErreurs {
  nom?: string;
  prenom?: string;
  username?: string;
  telephone?: string;
  email?: string;
}

/** Badge coloré pour le rôle (valeur métier brute : PROPRIETAIRE/AGRICULTEUR). */
function BadgeRole({ role }: { role: string }) {
  const estProprietaire = role === 'PROPRIETAIRE';
  return (
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
      {role}
    </span>
  );
}

/** Badge d'état d'activation du compte (fait foi : la valeur serveur). */
function BadgeActivation({ estVerifie, libelleActif, libelleAttente }: { estVerifie: boolean; libelleActif: string; libelleAttente: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: estVerifie ? '#ecfdf3' : '#fffcf5',
        color: estVerifie ? '#027a48' : '#b54708',
      }}
    >
      {estVerifie ? <ShieldCheck size={12} /> : <Clock3 size={12} />}
      {estVerifie ? libelleActif : libelleAttente}
    </span>
  );
}

export function Utilisateurs() {
  const { t } = useTranslation();
  const { utilisateur, chargement: chargementSession } = useUtilisateur();
  const estProprietaire = utilisateur?.role === 'PROPRIETAIRE';

  const [lignes, setLignes] = useState<UtilisateurApercu[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<UtilisateurApercu | null>(null);

  // ── Création de compte (réservée au propriétaire) ───────────────
  const [modalOuverte, setModalOuverte] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [telephone, setTelephone] = useState('');
  const [langue, setLangue] = useState<'fr' | 'en' | 'mg'>('fr');
  const [champErreurs, setChampErreurs] = useState<ChampErreurs>({});
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [creationMessage, setCreationMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null);

  const ouvrirModal = () => {
    setNom('');
    setPrenom('');
    setEmail('');
    setUsername('');
    setTelephone('');
    setLangue('fr');
    setChampErreurs({});
    setCreationMessage(null);
    setModalOuverte(true);
  };

  const fermerModal = () => {
    if (creationEnCours) return;
    setModalOuverte(false);
  };

  const soumettreCreation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (creationEnCours) return;

    const erreurs: ChampErreurs = {};
    const nomNet = nom.trim();
    const emailNet = email.trim();

    if (!nomNet) erreurs.nom = t('utilisateurs.creation.nomObligatoire');
    else if (nomNet.length < 2) erreurs.nom = t('utilisateurs.creation.nomCourt');
    if (!emailNet) erreurs.email = t('utilisateurs.creation.emailObligatoire');
    else if (!REGEX_EMAIL.test(emailNet)) erreurs.email = t('utilisateurs.creation.emailInvalide');

    setChampErreurs(erreurs);
    setCreationMessage(null);
    if (Object.keys(erreurs).length > 0) return;

    setCreationEnCours(true);
    try {
      const resultat = await creerUtilisateur({
        nom: nomNet,
        prenom: prenom.trim() || undefined,
        email: emailNet.toLowerCase(),
        username: username.trim().toLowerCase() || undefined,
        telephone: telephone.trim() || undefined,
        langue,
      });
      setCreationMessage({
        type: 'succes',
        texte: resultat.message || t('utilisateurs.creation.succesDefaut'),
      });
      void charge();
    } catch (err) {
      let message = messageErreur(err);
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        message =
          (err.response.data as { message?: string | string[] })?.message?.toString() ??
          'Un compte existe déjà pour cette adresse e-mail.';
        setChampErreurs((courantes) => ({ ...courantes, email: Array.isArray(message) ? message[0] : (message as string) }));
      }
      setCreationMessage({ type: 'erreur', texte: Array.isArray(message) ? message.join(' ') : message });
    } finally {
      setCreationEnCours(false);
    }
  };

  const charge = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const comptes = await getUtilisateurs();
      setLignes(comptes);
    } catch (e) {
      setLignes([]);
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    // Inutile de frapper GET /users (403 garanti) tant que le rôle n'est pas
    // connu ou n'est pas propriétaire.
    if (chargementSession || !estProprietaire) return;
    void charge();
  }, [charge, chargementSession, estProprietaire]);

  const champsTexte = (
    erreurChamp: string | undefined,
    id: string,
    label: string,
    valeur: string,
    onChange: (valeur: string) => void,
    props: {
      type?: string;
      placeholder?: string;
      required?: boolean;
      icon?: React.ReactNode;
      maxLength?: number;
      autoComplete?: string;
    } = {},
  ) => (
    <div className="champ">
      <label htmlFor={id} style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: '#344054' }}>
        {label}
        {props.required ? <span aria-hidden="true" style={{ color: '#D92D20', marginLeft: 3 }}>*</span> : null}
      </label>
      <div style={{ position: 'relative' }}>
        {props.icon ? (
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#98A2B3', display: 'grid', placeItems: 'center' }}>
            {props.icon}
          </span>
        ) : null}
        <input
          id={id}
          className="input"
          type={props.type ?? 'text'}
          required={props.required}
          value={valeur}
          maxLength={props.maxLength}
          autoComplete={props.autoComplete}
          placeholder={props.placeholder}
          onChange={(evt: ChangeEvent<HTMLInputElement>) => onChange(evt.target.value)}
          aria-invalid={erreurChamp ? true : undefined}
          aria-describedby={erreurChamp ? `${id}-erreur` : undefined}
          disabled={creationEnCours}
          style={{ paddingLeft: props.icon ? 34 : undefined }}
        />
      </div>
      {erreurChamp ? (
        <p id={`${id}-erreur`} role="alert" style={{ color: '#D92D20', fontSize: 11.5, margin: '4px 0 0' }}>
          {erreurChamp}
        </p>
      ) : null}
    </div>
  );

  const filtres = lignes.filter((u) => {
    if (!q) return true;
    const aiguille = q.toLowerCase();
    return (
      u.nomComplet.toLowerCase().includes(aiguille) ||
      u.username.toLowerCase().includes(aiguille) ||
      (u.email ?? '').toLowerCase().includes(aiguille) ||
      u.role.toLowerCase().includes(aiguille)
    );
  });

  const colonnes: Colonne<UtilisateurApercu>[] = [
    {
      cle: 'nomComplet',
      entete: t('commun.colonnes.utilisateur'),
      rendu: (u) => (
        <div>
          <div style={{ fontWeight: 700 }}>{u.nomComplet}</div>
          <div style={{ fontSize: 11, color: '#98a2b3' }}>@{u.username}</div>
        </div>
      ),
    },
    {
      cle: 'email',
      entete: t('utilisateurs.colonnes.email'),
      rendu: (u) => u.email || '—',
    },
    {
      cle: 'role',
      entete: t('utilisateurs.colonnes.role'),
      rendu: (u) => <BadgeRole role={u.role} />,
    },
    {
      cle: 'statut',
      entete: t('commun.colonnes.statut'),
      rendu: (u) => (
        <BadgeActivation
          estVerifie={u.estVerifie}
          libelleActif={t('utilisateurs.actif')}
          libelleAttente={t('utilisateurs.enAttente')}
        />
      ),
    },
    {
      cle: 'actions',
      entete: t('commun.colonnes.actions'),
      largeur: '1%',
      rendu: (u) => (
        <button type="button" className="btn btn-ghost btn-mini" data-testid={`detail-${u.id}`} onClick={() => setDetail(u)}>
          <Eye size={15} /> {t('commun.actions.details')}
        </button>
      ),
    },
  ];

  // Garde d'accès côté interface (le serveur reste le gardien : GET /users
  // et POST /users/creer-compte renvoient 403 aux non-propriétaires).
  if (!chargementSession && utilisateur && !estProprietaire) {
    return (
      <div className="card" style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }} data-testid="utilisateurs-acces-refuse">
        <span style={{ width: 52, height: 52, borderRadius: 16, background: '#FEF3F2', color: '#B42318', display: 'grid', placeItems: 'center' }}>
          <ShieldX size={24} />
        </span>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{t('utilisateurs.accesReserve')}</h1>
        <p style={{ color: '#667085', fontSize: 13, margin: 0, maxWidth: 420 }}>{t('utilisateurs.accesReserveDesc')}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>{t('utilisateurs.titre')}</h1>
          <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>
            {t('utilisateurs.sousTitre')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {estProprietaire ? (
            <button className="btn btn-primary" onClick={ouvrirModal} data-testid="ajouter-utilisateur">
              <UserPlus size={16} /> {t('utilisateurs.ajouter')}
            </button>
          ) : null}
          <button className="btn btn-outline" onClick={() => void charge()} disabled={chargement}>
            <RefreshCw size={16} /> {t('commun.actions.actualiser')}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
          <input
            className="input"
            placeholder={t('utilisateurs.recherche')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      <TableauDonnees
        colonnes={colonnes}
        lignes={filtres}
        chargement={chargement}
        erreur={erreur}
        texteVide={t('utilisateurs.vide')}
        cleLigne={(u) => u.id}
      />

      {estProprietaire ? (
        <Modale
          ouvert={modalOuverte}
          titre={t('utilisateurs.creation.titre')}
          sousTitre={t('utilisateurs.creation.sousTitre')}
          icone={<UserPlus size={18} color="#2E7D32" />}
          onFermer={fermerModal}
          idTest="modal-creer-utilisateur"
          pieds={
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', gap: 7, alignItems: 'flex-start', color: '#667085', fontSize: 11.5, flex: 1, minWidth: 200 }}>
                <Globe2 size={13} style={{ flex: '0 0 auto', marginTop: 1 }} />
                <span>{t('utilisateurs.creation.activationNote')}</span>
              </span>
              <span style={{ display: 'inline-flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={fermerModal} disabled={creationEnCours}>
                  {t('commun.actions.annuler')}
                </button>
                <button form="form-creer-utilisateur" type="submit" className="btn btn-primary" disabled={creationEnCours} data-testid="submit-creer-utilisateur">
                  {creationEnCours ? <Loader2 size={16} className="spin" /> : <UserPlus size={16} />}
                  {creationEnCours ? t('utilisateurs.creation.enCours') : t('utilisateurs.creation.creer')}
                </button>
              </span>
            </div>
          }
        >
          <form id="form-creer-utilisateur" onSubmit={soumettreCreation} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {creationMessage ? (
              <div
                role={creationMessage.type === 'erreur' ? 'alert' : 'status'}
                style={{
                  display: 'flex', gap: 9, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12, fontSize: 13,
                  background: creationMessage.type === 'succes' ? '#ECFDF3' : '#FEF3F2',
                  color: creationMessage.type === 'succes' ? '#027A48' : '#B42318',
                  border: `1px solid ${creationMessage.type === 'succes' ? '#A6F4C5' : '#FECDCA'}`,
                }}
              >
                {creationMessage.type === 'succes' ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}
                <span style={{ flex: 1 }}>{creationMessage.texte}</span>
              </div>
            ) : null}

            {champsTexte(champErreurs.nom, 'creation-nom', t('auth.nom'), nom, setNom, {
              required: true,
              maxLength: 80,
              placeholder: 'Rabekoto',
              icon: <User size={15} />,
              autoComplete: 'family-name',
            })}
            {champsTexte(champErreurs.prenom, 'creation-prenom', t('auth.prenom'), prenom, setPrenom, {
              maxLength: 80,
              placeholder: 'Jean',
              icon: <User size={15} />,
              autoComplete: 'given-name',
            })}
            {champsTexte(champErreurs.email, 'creation-email', t('auth.email'), email, setEmail, {
              type: 'email',
              required: true,
              maxLength: 254,
              placeholder: 'jean@exemple.mg',
              icon: <AtSign size={15} />,
              autoComplete: 'email',
            })}
            {champsTexte(champErreurs.username, 'creation-username', t('auth.nomUtilisateur'), username, (v) => setUsername(v.toLowerCase()), {
              maxLength: 30,
              placeholder: 'jeanrabekoto',
              autoComplete: 'username',
            })}
            {champsTexte(champErreurs.telephone, 'creation-telephone', t('auth.telephone'), telephone, setTelephone, {
              type: 'tel',
              maxLength: 30,
              placeholder: '+261 34 00 000 00',
              icon: <Phone size={15} />,
              autoComplete: 'tel',
            })}

            <div className="champ">
              <label htmlFor="creation-role" style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: '#344054' }}>
                {t('utilisateurs.creation.roleFixe')}
              </label>
              <div className="input" style={{ background: '#F9FAFB', color: '#667085', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={15} /> {t('utilisateurs.creation.roleValeur')}
              </div>
            </div>

            <div className="champ">
              <label htmlFor="creation-langue" style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5, color: '#344054' }}>
                {t('auth.langue')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#98A2B3', display: 'grid', placeItems: 'center' }}>
                  <Globe2 size={15} />
                </span>
                <select
                  id="creation-langue"
                  className="input"
                  value={langue}
                  onChange={(e) => setLangue(e.target.value as 'fr' | 'en' | 'mg')}
                  disabled={creationEnCours}
                  style={{ paddingLeft: 34, appearance: 'auto' }}
                >
                  <option value="fr">{t('langue.fr')}</option>
                  <option value="mg">{t('langue.mg')}</option>
                  <option value="en">{t('langue.en')}</option>
                </select>
              </div>
            </div>
          </form>
        </Modale>
      ) : null}

      <PanneauDetail
        ouvert={detail !== null}
        onFermer={() => setDetail(null)}
        titre={t('detail.titreUtilisateur')}
        sousTitre={detail?.nomComplet}
        icone={<CircleUser size={18} color="#2E7D32" />}
        idTest="detail-utilisateur"
        sections={
          detail
            ? [
                {
                  titre: t('detail.informations'),
                  champs: [
                    { libelle: t('auth.nom'), valeur: detail.nom },
                    { libelle: t('auth.prenom'), valeur: detail.prenom },
                    { libelle: t('auth.nomUtilisateur'), valeur: detail.username ? `@${detail.username}` : null },
                    { libelle: t('utilisateurs.colonnes.email'), valeur: detail.email },
                    { libelle: t('utilisateurs.colonnes.role'), valeur: <BadgeRole role={detail.role} /> },
                    {
                      libelle: t('commun.colonnes.statut'),
                      valeur: (
                        <BadgeActivation
                          estVerifie={detail.estVerifie}
                          libelleActif={t('utilisateurs.actif')}
                          libelleAttente={t('utilisateurs.enAttente')}
                        />
                      ),
                    },
                  ],
                },
                {
                  titre: t('detail.technique'),
                  champs: [{ libelle: t('detail.identifiant'), valeur: <code style={{ fontSize: 11 }}>{detail.id}</code>, large: true }],
                },
              ]
            : []
        }
      />
    </div>
  );
}
