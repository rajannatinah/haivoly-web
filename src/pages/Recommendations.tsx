import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Eye,
  Inbox,
  Info,
  MailOpen,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from 'lucide-react';

import {
  createRecommendation,
  deleteRecommendation,
  getRecommendations,
  getRecommendationsPourMoi,
  markAllRecommendationsRead,
  markRecommendationRead,
  markRecommendationUnread,
  normaliseListe,
  type DestinataireApercu,
} from '../services/api';
import { useConfirm } from '../components/ui/ConfirmProvider';
import { ALIAS_DIFFUSION, UserSearchSelect } from '../components/ui/UserSearchSelect';
import { ErreurBloc, VideBloc, messageErreur } from '../components/ui/ErrorState';
import { FiltreSegmente } from '../components/ui/FiltreSegmente';
import { Modale } from '../components/ui/Modale';
import { PanneauDetail } from '../components/ui/PanneauDetail';
import { useNotifications } from '../components/Layout/NotificationsProvider';
import { useUtilisateur } from '../components/Layout/UserProvider';
import {
  compteRenduPublication,
  detailDestinataire,
  libelleDestinataire,
} from '../utils/destinataire';
import { nomEmetteur } from '../utils/emetteur';
import { formaterDateHeure } from '../i18n';
import type { Recommendation } from '../types';

type Direction = 'recues' | 'envoyees';
type Statut = 'toutes' | 'nonLues' | 'lues';
type Priorite = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type TypeReco = 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';

function iconeDe(r: Recommendation, taille = 16) {
  if (r.priority === 'URGENT') return <AlertTriangle size={taille} color="#D92D20" />;
  if (r.priority === 'HIGH') return <AlertTriangle size={taille} color="#F79009" />;
  if (r.type === 'SUCCESS') return <CheckCircle2 size={taille} color="#039855" />;
  if (r.type === 'ALERT') return <Bell size={taille} color="#B54708" />;
  return <Info size={taille} color="#1570EF" />;
}

function classePriorite(p: string) {
  return p === 'URGENT' ? 'badge badge-error' : p === 'HIGH' ? 'badge badge-warning' : 'badge badge-info';
}

/**
 * Page Recommandations (lot 9) :
 * - deux filtres de direction : « Reçues » (notifications venant des autres
 *   comptes) et « Envoyées » (recommandations publiées vers le mobile) ;
 * - mode de lecture : non-lues en évidence, marquage lu/non-lu à l'unité ou
 *   en masse, badge de compteur synchronisé avec la cloche ;
 * - ajout derrière un bouton qui ouvre une modale de saisie ;
 * - action « Détails » sur chaque carte.
 */
export function Recommendations() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { utilisateur } = useUtilisateur();
  const { rafraichir } = useNotifications();
  const [params, setParams] = useSearchParams();

  const estProprietaire = utilisateur?.role === 'PROPRIETAIRE';

  const [direction, setDirection] = useState<Direction>('recues');
  const [statut, setStatut] = useState<Statut>('toutes');
  const [q, setQ] = useState('');

  const [recues, setRecues] = useState<Recommendation[]>([]);
  const [envoyees, setEnvoyees] = useState<Recommendation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [accuse, setAccuse] = useState<string | null>(null);

  const [detail, setDetail] = useState<Recommendation | null>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  // Formulaire d'ajout (modale).
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priorite>('MEDIUM');
  const [type, setType] = useState<TypeReco>('INFO');
  const [userId, setUserId] = useState('');
  const [destinataire, setDestinataire] = useState<DestinataireApercu | null>(null);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const brutes = (await getRecommendationsPourMoi()) as Recommendation[];
      setRecues(brutes);
      if (utilisateur?.role === 'PROPRIETAIRE' && utilisateur?.id) {
        const reponse = await getRecommendations({ createdById: utilisateur.id, limit: 100 });
        setEnvoyees(normaliseListe(reponse) as Recommendation[]);
      } else {
        setEnvoyees([]);
      }
    } catch (error) {
      // Aucune donnée de repli : l'erreur réelle est affichée.
      setRecues([]);
      setEnvoyees([]);
      setErreur(messageErreur(error));
    } finally {
      setChargement(false);
    }
  }, [utilisateur?.id, utilisateur?.role]);

  useEffect(() => {
    if (utilisateur) void charger();
  }, [utilisateur, charger]);

  /** Marquage lu local + compteur de la cloche, sans recharger toute la liste. */
  const appliquerLecture = useCallback(
    (id: string, lue: boolean) => {
      const maj = (r: Recommendation) =>
        r.id === id ? { ...r, readAt: lue ? r.readAt ?? new Date().toISOString() : null } : r;
      setRecues((prev) => prev.map(maj));
      setEnvoyees((prev) => prev.map(maj));
      setDetail((prev) => (prev && prev.id === id ? maj(prev) : prev));
      void rafraichir();
    },
    [rafraichir],
  );

  /** Lien profond `?detail=<id>` (cloche, e-mail) : ouvre la fiche au chargement. */
  useEffect(() => {
    const idDetail = params.get('detail');
    if (!idDetail || chargement) return;
    const trouve = recues.find((r) => r.id === idDetail) ?? envoyees.find((r) => r.id === idDetail);
    if (trouve) {
      setDetail(trouve);
      if (!trouve.readAt && trouve.userId === utilisateur?.id) {
        markRecommendationRead(trouve.id)
          .then(() => appliquerLecture(trouve.id, true))
          .catch(() => {});
      }
    }
    params.delete('detail');
    setParams(params, { replace: true });
  }, [params, setParams, chargement, recues, envoyees, utilisateur?.id, appliquerLecture]);

  const nonLues = useMemo(() => recues.filter((r) => !r.readAt).length, [recues]);

  const affichees = useMemo(() => {
    const source = direction === 'recues' ? recues : envoyees;
    const aiguille = q.trim().toLowerCase();
    return source.filter((r) => {
      if (direction === 'recues' && statut === 'nonLues' && r.readAt) return false;
      if (direction === 'recues' && statut === 'lues' && !r.readAt) return false;
      if (!aiguille) return true;
      return (
        r.title.toLowerCase().includes(aiguille) ||
        r.message.toLowerCase().includes(aiguille) ||
        nomEmetteur(r).toLowerCase().includes(aiguille) ||
        libelleDestinataire(r).toLowerCase().includes(aiguille)
      );
    });
  }, [direction, recues, envoyees, statut, q]);

  const basculerLu = async (r: Recommendation) => {
    const versLue = !r.readAt;
    try {
      if (versLue) await markRecommendationRead(r.id);
      else await markRecommendationUnread(r.id);
      appliquerLecture(r.id, versLue);
    } catch (error) {
      setErreur(messageErreur(error));
    }
  };

  const toutMarquerLu = async () => {
    try {
      const updated = await markAllRecommendationsRead();
      const horodatage = new Date().toISOString();
      setRecues((prev) => prev.map((r) => (r.readAt ? r : { ...r, readAt: horodatage })));
      setDetail((prev) => (prev && !prev.readAt ? { ...prev, readAt: horodatage } : prev));
      await rafraichir();
      setAccuse(t('recommandations.toutMarquerLuFait', { count: updated }));
    } catch (error) {
      setErreur(messageErreur(error));
    }
  };

  const supprimer = async (r: Recommendation) => {
    const ok = await confirm({
      title: t('recommandations.supprimerTitre', { titre: r.title }),
      description: t('recommandations.supprimerDescription'),
      confirmLabel: t('commun.actions.supprimer'),
      cancelLabel: t('commun.actions.annuler'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteRecommendation(r.id);
      // Retrait des listes uniquement après confirmation du serveur.
      setRecues((prev) => prev.filter((x) => x.id !== r.id));
      setEnvoyees((prev) => prev.filter((x) => x.id !== r.id));
      setDetail((prev) => (prev?.id === r.id ? null : prev));
      await rafraichir();
    } catch (error) {
      setErreur(messageErreur(error));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || envoiEnCours) return;

    setEnvoiEnCours(true);
    setErreurEnvoi(null);
    try {
      const rep = await createRecommendation({
        title: title.trim(),
        message: message.trim(),
        priority,
        type,
        // Le sélecteur n'envoie que des identifiants qu'il a reçus du serveur ;
        // `all` reste l'alias historique de la diffusion au périmètre.
        userId: userId || ALIAS_DIFFUSION,
      });
      setAccuse(compteRenduPublication(rep, destinataire));
      setTitle('');
      setMessage('');
      setPriority('MEDIUM');
      setType('INFO');
      setUserId('');
      setDestinataire(null);
      setAjoutOuvert(false);
      await charger();
      await rafraichir();
    } catch (error) {
      // Les valeurs saisies sont conservées pour permettre la correction.
      setErreurEnvoi(messageErreur(error));
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const peutSupprimer = (r: Recommendation) => estProprietaire || r.userId === utilisateur?.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Bell size={20} color="#2E7D32" /> {t('recommandations.titre')}
          </h1>
          <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0', maxWidth: 720 }}>
            {t('recommandations.sousTitre')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {direction === 'recues' && nonLues > 0 ? (
            <button type="button" className="btn btn-outline" data-testid="tout-marquer-lu-page" onClick={() => void toutMarquerLu()}>
              <CheckCheck size={16} /> {t('recommandations.toutMarquerLu')}
            </button>
          ) : null}
          <button type="button" className="btn btn-outline" onClick={() => void charger()} disabled={chargement}>
            <RefreshCw size={16} /> {t('commun.actions.actualiser')}
          </button>
          {estProprietaire ? (
            <button
              type="button"
              className="btn btn-primary"
              data-testid="ajouter-recommandation"
              onClick={() => {
                setErreurEnvoi(null);
                setAjoutOuvert(true);
              }}
            >
              <Plus size={16} /> {t('recommandations.ajouter')}
            </button>
          ) : null}
        </div>
      </div>

      {erreur && <ErreurBloc erreur={erreur} onRetry={() => void charger()} />}
      {accuse && !erreur && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            border: '1px solid #ABEFC6',
            background: '#EDF7ED',
            color: '#039855',
            borderRadius: 12,
            padding: '10px 12px',
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={16} /> {accuse}
        </div>
      )}

      <div className="card" style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <FiltreSegmente<Direction>
          ariaLabel={t('recommandations.filtreDirectionAria')}
          idTest="filtre-direction"
          valeur={direction}
          onChange={(v) => {
            setDirection(v);
            setStatut('toutes');
          }}
          options={[
            { valeur: 'recues', libelle: t('recommandations.ongletRecues'), icone: <Inbox size={15} />, badge: nonLues },
            ...(estProprietaire
              ? [{ valeur: 'envoyees' as Direction, libelle: t('recommandations.ongletEnvoyees'), icone: <Send size={15} /> }]
              : []),
          ]}
        />
        {direction === 'recues' ? (
          <FiltreSegmente<Statut>
            ariaLabel={t('recommandations.filtreLectureAria')}
            idTest="filtre-lecture"
            valeur={statut}
            onChange={setStatut}
            options={[
              { valeur: 'toutes', libelle: t('recommandations.statutToutes') },
              { valeur: 'nonLues', libelle: t('recommandations.statutNonLues') },
              { valeur: 'lues', libelle: t('recommandations.statutLues') },
            ]}
          />
        ) : null}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
          <input
            className="input"
            placeholder={t('recommandations.recherche')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: 34 }}
            aria-label={t('recommandations.recherche')}
          />
        </div>
        <span className="badge">{t('commun.etats.resultats', { count: affichees.length })}</span>
      </div>

      {chargement ? (
        <div className="card" style={{ padding: 28, textAlign: 'center', color: '#667085' }}>
          <span className="loading-dots"><i /><i /><i /></span>
        </div>
      ) : affichees.length === 0 ? (
        <div className="card">
          <VideBloc
            texte={
              q || statut !== 'toutes'
                ? t('recommandations.aucuneCorrespondance')
                : direction === 'recues'
                  ? t('recommandations.videRecues')
                  : t('recommandations.videEnvoyees')
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-testid="liste-recommandations">
          {affichees.map((r) => {
            const estMienne = r.userId === utilisateur?.id;
            return (
              <article
                key={r.id}
                className={`reco-carte ${estMienne && !r.readAt ? 'non-lue' : ''}`}
                data-testid={`reco-${r.id}`}
                style={
                  r.priority === 'URGENT'
                    ? { background: '#FEF3F2' }
                    : r.priority === 'HIGH'
                      ? { background: '#FFFAEB' }
                      : undefined
                }
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontWeight: estMienne && !r.readAt ? 800 : 700, fontSize: 13.5, display: 'flex', gap: 7, alignItems: 'center', minWidth: 0 }}>
                    {iconeDe(r)}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <span className={classePriorite(r.priority)}>{t(`recommandations.priorites.${r.priority}`)}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-mini"
                      data-testid={`detail-${r.id}`}
                      onClick={() => {
                        setDetail(r);
                        if (estMienne && !r.readAt) {
                          markRecommendationRead(r.id)
                            .then(() => appliquerLecture(r.id, true))
                            .catch(() => {});
                        }
                      }}
                    >
                      <Eye size={15} /> {t('commun.actions.details')}
                    </button>
                    {estMienne ? (
                      <button
                        type="button"
                        className="btn-icon-action"
                        data-testid={`lecture-${r.id}`}
                        onClick={() => void basculerLu(r)}
                        title={r.readAt ? t('recommandations.marquerNonLue') : t('recommandations.marquerLue')}
                        aria-label={r.readAt ? t('recommandations.marquerNonLue') : t('recommandations.marquerLue')}
                      >
                        {r.readAt ? <MailOpen size={15} /> : <CheckCheck size={15} />}
                      </button>
                    ) : null}
                    {peutSupprimer(r) ? (
                      <button
                        type="button"
                        className="btn-icon-action danger"
                        data-testid={`supprimer-${r.id}`}
                        onClick={() => void supprimer(r)}
                        title={t('commun.actions.supprimer')}
                        aria-label={t('recommandations.supprimerAria', { titre: r.title })}
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="reco-message">{r.message}</div>
                <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 8, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span title={direction === 'recues' ? nomEmetteur(r) : detailDestinataire(r)}>
                    {direction === 'recues'
                      ? `${t('recommandations.emetteur')} : ${nomEmetteur(r) || '—'}`
                      : `${t('recommandations.destinataire')} : ${libelleDestinataire(r)}`}{' '}
                    • {formaterDateHeure(r.createdAt)}
                  </span>
                  <span className={`badge ${r.readAt ? 'badge-neutral' : 'badge-success'}`}>
                    {r.readAt ? t('recommandations.lue') : t('recommandations.nonLue')}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Détail de la recommandation sélectionnée */}
      <PanneauDetail
        ouvert={detail !== null}
        onFermer={() => setDetail(null)}
        titre={detail?.title ?? ''}
        sousTitre={detail ? formaterDateHeure(detail.createdAt) : undefined}
        icone={detail ? iconeDe(detail, 18) : undefined}
        idTest="detail-recommandation"
        sections={
          detail
            ? [
                {
                  titre: t('recommandations.detailContenu'),
                  champs: [
                    { libelle: t('commun.colonnes.type'), valeur: t(`statuts.recommandation.${detail.type}`) },
                    { libelle: t('recommandations.priorite'), valeur: <span className={classePriorite(detail.priority)}>{t(`recommandations.priorites.${detail.priority}`)}</span> },
                    { libelle: t('recommandations.message'), valeur: <span style={{ whiteSpace: 'pre-wrap' }}>{detail.message}</span>, large: true },
                  ],
                },
                {
                  titre: t('recommandations.detailActeurs'),
                  champs: [
                    { libelle: t('recommandations.emetteur'), valeur: nomEmetteur(detail) },
                    { libelle: t('recommandations.destinataire'), valeur: libelleDestinataire(detail), },
                  ],
                },
                {
                  titre: t('recommandations.detailSuivi'),
                  champs: [
                    { libelle: t('recommandations.creeLe'), valeur: formaterDateHeure(detail.createdAt) },
                    { libelle: t('recommandations.lueLe'), valeur: detail.readAt ? formaterDateHeure(detail.readAt) : t('recommandations.nonLue') },
                    { libelle: t('recommandations.expireLe'), valeur: detail.expiresAt ? formaterDateHeure(detail.expiresAt) : null },
                    { libelle: t('recommandations.identifiant'), valeur: <code style={{ fontSize: 11 }}>{detail.id}</code>, large: true },
                  ],
                  json: detail.metadata ? { libelle: t('detail.metadata'), valeur: detail.metadata } : undefined,
                },
              ]
            : []
        }
        actions={
          detail
            ? <>
                {detail.userId === utilisateur?.id ? (
                  <button type="button" className="btn btn-outline" onClick={() => void basculerLu(detail)}>
                    {detail.readAt ? <MailOpen size={15} /> : <CheckCheck size={15} />}{' '}
                    {detail.readAt ? t('recommandations.marquerNonLue') : t('recommandations.marquerLue')}
                  </button>
                ) : null}
                {peutSupprimer(detail) ? (
                  <button type="button" className="btn btn-outline" style={{ color: '#D92D20', borderColor: '#FECACA' }} onClick={() => void supprimer(detail)}>
                    <Trash2 size={15} /> {t('commun.actions.supprimer')}
                  </button>
                ) : null}
              </>
            : undefined
        }
      />

      {/* Ajout d'une recommandation (modale ouverte par le bouton « Ajouter ») */}
      <Modale
        ouvert={ajoutOuvert}
        onFermer={() => setAjoutOuvert(false)}
        titre={t('recommandations.nouvelle')}
        sousTitre={t('recommandations.nouvelleSousTitre')}
        icone={<Send size={18} color="#2E7D32" />}
        idTest="modale-ajout"
        pieds={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setAjoutOuvert(false)}>
              {t('commun.actions.annuler')}
            </button>
            <button type="submit" form="form-ajout-reco" className="btn btn-primary" disabled={envoiEnCours || !title.trim() || !message.trim()}>
              <Send size={16} /> {envoiEnCours ? t('commun.actions.patientez') : t('recommandations.envoyerVersMobile')}
            </button>
          </>
        }
      >
        <form id="form-ajout-reco" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {erreurEnvoi && <ErreurBloc erreur={erreurEnvoi} />}
          <input
            className="input"
            placeholder={t('recommandations.titreExemple')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={160}
            aria-label={t('recommandations.titreExemple')}
          />
          <textarea
            className="input"
            placeholder={t('recommandations.messagePlaceholder')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            maxLength={2000}
            aria-label={t('recommandations.messagePlaceholder')}
            style={{ minHeight: 96, paddingTop: 10, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as TypeReco)}
              style={{ flex: 1, minWidth: 150 }}
              aria-label={t('commun.colonnes.type')}
            >
              {(['INFO', 'WARNING', 'SUCCESS', 'ALERT'] as const).map((tp) => (
                <option key={tp} value={tp}>
                  {t(`statuts.recommandation.${tp}`)}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priorite)}
              style={{ flex: 1, minWidth: 130 }}
              aria-label={t('recommandations.priorite')}
            >
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                <option key={p} value={p}>
                  {t(`recommandations.priorites.${p}`)}
                </option>
              ))}
            </select>
          </div>
          <UserSearchSelect
            value={userId}
            onChange={(idChoisi, compte) => {
              setUserId(idChoisi);
              setDestinataire(compte);
              setAccuse(null);
            }}
          />
          <div style={{ fontSize: 11, color: '#98A2B3', lineHeight: 1.5 }}>
            {t('recommandations.architecture')}
          </div>
        </form>
      </Modale>
    </div>
  );
}
