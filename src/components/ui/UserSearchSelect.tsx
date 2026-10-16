import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Loader2, Search, Users, UserX, X } from 'lucide-react';

import { rechercherUtilisateurs, type DestinataireApercu } from '../../services/api';
import { messageErreur } from './ErrorState';


/** Délai avant requête : assez court pour rester réactif, assez long pour
 *  éviter une requête par frappe. */
const DELAI_RECHERCHE_MS = 300;
const LIGNE_MAX = 10;

/** Alias de diffusion accepté par le serveur (`POST /recommendations`). */
export const ALIAS_DIFFUSION = 'all';

export interface UserSearchSelectProps {
  /** Identifiant retenu : id du destinataire, `all`, ou chaîne vide. */
  value: string;
  onChange: (value: string, destinataire: DestinataireApercu | null) => void;
  /** Autorise l'option « diffuser à tout mon périmètre ». */
  autoriserDiffusion?: boolean;
  id?: string;
}

export function UserSearchSelect({
  value,
  onChange,
  autoriserDiffusion = true,
  id = 'destinataire',
}: UserSearchSelectProps) {
  const { t } = useTranslation();
  const [terme, setTerme] = useState('');
  const [resultats, setResultats] = useState<DestinataireApercu[]>([]);
  const [choisi, setChoisi] = useState<DestinataireApercu | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [surbrille, setSurbrille] = useState(-1);
  const conteneur = useRef<HTMLDivElement | null>(null);
  const champ = useRef<HTMLInputElement | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const annulateur = useRef<AbortController | null>(null);

  const diffusion = value === ALIAS_DIFFUSION;
  const lignes = useMemo(() => resultats.slice(0, LIGNE_MAX), [resultats]);

  // Une ligne « tous » en tête de liste change les indices : on les centralise.
  const options = useMemo(
    () => (autoriserDiffusion ? [{ alias: true as const }, ...lignes] : lignes),
    [autoriserDiffusion, lignes],
  );

  useEffect(() => {
    if (minuteur.current) clearTimeout(minuteur.current);

    const requete = terme.trim();
    if (!ouvert || requete.length === 0) {
      setResultats([]);
      setErreur(null);
      setEnCours(false);
      return;
    }

    setEnCours(true);
    minuteur.current = setTimeout(async () => {
      annulateur.current?.abort();
      const controle = new AbortController();
      annulateur.current = controle;

      try {
        const page = await rechercherUtilisateurs(requete, {
          signal: controle.signal,
          limit: LIGNE_MAX,
        });
        if (controle.signal.aborted) return;
        setResultats(page.items);
        setSurbrille(-1);
        setErreur(null);
      } catch (cause) {
        // Requête annulée par une frappe plus récente : ce n'est pas une panne.
        if (controle.signal.aborted) return;
        setErreur(messageErreur(cause));
      } finally {
        if (!controle.signal.aborted) setEnCours(false);
      }
    }, DELAI_RECHERCHE_MS);

    return () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    };
  }, [terme, ouvert]);

  useEffect(
    () => () => {
      annulateur.current?.abort();
      if (minuteur.current) clearTimeout(minuteur.current);
    },
    [],
  );

  // Fermeture au clic ailleurs : la liste est un panneau, pas une fenêtre fixe.
  useEffect(() => {
    if (!ouvert) return;
    const gestionnaire = (evenement: MouseEvent) => {
      if (!conteneur.current?.contains(evenement.target as Node)) setOuvert(false);
    };
    document.addEventListener('mousedown', gestionnaire);
    return () => document.removeEventListener('mousedown', gestionnaire);
  }, [ouvert]);

  const reinitialiser = () => {
    setChoisi(null);
    setTerme('');
    setResultats([]);
    setErreur(null);
    onChange('', null);
  };

  const selectionnerLigne = (index: number) => {
    const option = options[index];
    if (!option) return;
    if ('alias' in option) {
      setChoisi(null);
      setOuvert(false);
      setTerme('');
      onChange(ALIAS_DIFFUSION, null);
      return;
    }
    const ligne = option as DestinataireApercu;
    // Un compte non activé ne peut rien recevoir : le serveur le refuse.
    if (!ligne.estVerifie) return;
    setChoisi(ligne);
    setOuvert(false);
    setTerme('');
    onChange(ligne.id, ligne);
  };

  const surClavier = (evenement: React.KeyboardEvent<HTMLInputElement>) => {
    if (evenement.key === 'ArrowDown') {
      evenement.preventDefault();
      if (!ouvert) setOuvert(true);
      setSurbrille((valeur) => Math.min(valeur + 1, options.length - 1));
      return;
    }
    if (evenement.key === 'ArrowUp') {
      evenement.preventDefault();
      setSurbrille((valeur) => Math.max(valeur - 1, 0));
      return;
    }
    if (evenement.key === 'Enter') {
      if (!ouvert || options.length === 0) return;
      evenement.preventDefault();
      selectionnerLigne(surbrille >= 0 ? surbrille : 0);
      return;
    }
    if (evenement.key === 'Escape') {
      setOuvert(false);
    }
  };

  if (value && (choisi || diffusion)) {
    const libelle = diffusion
      ? t('destinataires.tous')
      : (choisi?.nomComplet || choisi?.username || value);
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: '1px solid #ABEFC6',
          background: '#EDF7ED',
          borderRadius: 10,
          padding: '8px 10px',
        }}
      >
        {diffusion ? (
          <Users size={16} color="#2E7D32" />
        ) : (
          <Check size={16} color="#2E7D32" />
        )}
        <span style={{ fontSize: 12, color: '#101828', fontWeight: 700, flex: 1 }}>
          {t('destinataires.selectionne', { nom: libelle })}
        </span>
        <button
          type="button"
          onClick={() => {
            reinitialiser();
            champ.current?.focus();
          }}
          aria-label={t('destinataires.effacerAria')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            border: '1px solid #EAECF0',
            background: 'white',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 700,
            color: '#344054',
            cursor: 'pointer',
          }}
        >
          <X size={12} /> {t('destinataires.modifier')}
        </button>
      </div>
    );
  }

  return (
    <div ref={conteneur} style={{ position: 'relative', flex: 1 }}>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#667085', marginBottom: 4 }}
      >
        {t('destinataires.titre')}
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={15}
            color="#98A2B3"
            style={{ position: 'absolute', left: 10, top: 11, pointerEvents: 'none' }}
          />
          <input
            id={id}
            ref={champ}
            className="input"
            role="combobox"
            aria-expanded={ouvert}
            aria-controls={`${id}-liste`}
            aria-autocomplete="list"
            aria-activedescendant={
              surbrille >= 0 ? `${id}-option-${surbrille}` : undefined
            }
            autoComplete="off"
            placeholder={t('destinataires.recherchePlaceholder')}
            value={terme}
            onFocus={() => setOuvert(true)}
            onChange={(evenement) => {
              setTerme(evenement.target.value);
              setOuvert(true);
            }}
            onKeyDown={surClavier}
            style={{ paddingLeft: 32, paddingRight: 32 }}
          />
          {enCours ? (
            <Loader2
              size={15}
              color="#2E7D32"
              style={{ position: 'absolute', right: 10, top: 11, color: '#2E7D32' }}
            />
          ) : (
            <ChevronDown
              size={15}
              color="#98A2B3"
              style={{ position: 'absolute', right: 10, top: 11, pointerEvents: 'none' }}
            />
          )}
        </div>
      </div>

      {ouvert && (
        <ul
          id={`${id}-liste`}
          role="listbox"
          aria-label={t('destinataires.ouvrirAria')}
          style={{
            listStyle: 'none',
            margin: '6px 0 0',
            padding: 4,
            position: 'absolute',
            zIndex: 30,
            width: '100%',
            maxHeight: 260,
            overflow: 'auto',
            background: 'white',
            border: '1px solid #EAECF0',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(16,24,40,.12)',
          }}
        >
          {options.map((option, index) => {
            if ('alias' in option) {
              return (
                <li
                  key="diffusion"
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={surbrille === index}
                  onMouseEnter={() => setSurbrille(index)}
                  onClick={() => selectionnerLigne(index)}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: surbrille === index ? '#F9FAFB' : 'transparent',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#2E7D32',
                  }}
                >
                  <Users size={14} /> {t('destinataires.tous')}
                </li>
              );
            }

            const ligne = option as DestinataireApercu;
            return (
              <li
                key={ligne.id}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={surbrille === index}
                aria-disabled={!ligne.estVerifie}
                title={ligne.estVerifie ? undefined : t('destinataires.enAttente')}
                onMouseEnter={() => setSurbrille(index)}
                onClick={() => selectionnerLigne(index)}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: ligne.estVerifie ? 'pointer' : 'not-allowed',
                  background: surbrille === index ? '#F9FAFB' : 'transparent',
                  opacity: ligne.estVerifie ? 1 : 0.65,
                }}
              >
                {ligne.estVerifie ? (
                  <Check size={14} color="#039855" />
                ) : (
                  <UserX size={14} color="#F79009" />
                )}
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#101828' }}>
                    {ligne.nomComplet || `${ligne.prenom ?? ''} ${ligne.nom}`.trim()}
                  </span>
                  <span style={{ fontSize: 11, color: '#667085', marginLeft: 6 }}>
                    @{ligne.username}
                    {ligne.email ? ` · ${ligne.email}` : ''}
                  </span>
                </span>
                {!ligne.estVerifie && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#B54708',
                      background: '#FFFAEB',
                      border: '1px solid #FEC84B',
                      borderRadius: 999,
                      padding: '2px 7px',
                    }}
                  >
                    {t('destinataires.enAttente')}
                  </span>
                )}
              </li>
            );
          })}

          {enCours && lignes.length === 0 && (
            <li style={{ padding: '10px 12px', fontSize: 12, color: '#667085' }}>
              {t('destinataires.chargement')}
            </li>
          )}
          {!enCours && terme.trim().length === 0 && (
            <li style={{ padding: '10px 12px', fontSize: 12, color: '#98A2B3' }}>
              {t('destinataires.tropCourt')}
            </li>
          )}
          {!enCours && terme.trim().length > 0 && lignes.length === 0 && !erreur && (
            <li style={{ padding: '10px 12px', fontSize: 12, color: '#98A2B3' }}>
              {t('destinataires.aucun')}
            </li>
          )}
          {erreur && (
            <li style={{ padding: '10px 12px', fontSize: 12, color: '#D92D20' }}>
              {t('destinataires.erreur', { message: erreur })}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
