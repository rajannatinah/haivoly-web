import { useTranslation } from 'react-i18next';
import { Check, Globe, Monitor } from 'lucide-react';

import {
  CHOIX_SYSTEME,
  LANGUES_DISPONIBLES,
  changerLangue,
  lireChoix,
  resoudreLangue,
  type ChoixLangue,
} from '../../i18n';
import { useMenuDeroulant } from './useMenuDeroulant';

/** Code court affiché sur l'icône (FR / EN / MG), lisible d'un coup d'œil. */
const CODES: Record<string, string> = { fr: 'FR', en: 'EN', mg: 'MG' };

/**
 * Changement de langue par icône (demande lot 9) : un bouton globe portant le
 * code de la langue active ouvre un petit menu — fini le <select> de 130 px
 * qui encombrait la barre du haut.
 */
export function SelecteurLangue() {
  const { t, i18n } = useTranslation();
  const menu = useMenuDeroulant();
  const choix: ChoixLangue = lireChoix();
  const effective = choix === CHOIX_SYSTEME ? resoudreLangue(i18n.language) : choix;

  const options: { valeur: ChoixLangue; libelle: string; icone?: typeof Monitor }[] = [
    { valeur: CHOIX_SYSTEME, libelle: t('langue.systeme'), icone: Monitor },
    ...LANGUES_DISPONIBLES.map((l) => ({
      valeur: l as ChoixLangue,
      libelle: t(`langue.${l}`),
    })),
  ];

  const choisir = async (valeur: ChoixLangue) => {
    menu.fermer();
    await changerLangue(valeur);
  };

  return (
    <div className="menu" ref={menu.ref}>
      <button
        type="button"
        className="icon-btn icon-btn-langue"
        data-declencheur
        data-testid="selecteur-langue"
        aria-label={t('langue.aria')}
        aria-expanded={menu.ouvert}
        title={t('langue.aria')}
        onClick={menu.basculer}
      >
        <Globe size={17} />
        <span className="langue-code" aria-hidden>
          {CODES[effective] ?? effective.toUpperCase()}
        </span>
      </button>

      {menu.ouvert ? (
        <div className="menu-panneau menu-langue" data-testid="menu-langue" role="menu" aria-label={t('langue.titre')}>
          {options.map((o) => {
            const actif = o.valeur === choix;
            return (
              <button
                key={o.valeur}
                type="button"
                role="menuitemradio"
                aria-checked={actif}
                className={`menu-item ${actif ? 'is-actif' : ''}`}
                data-testid={`langue-${o.valeur}`}
                onClick={() => void choisir(o.valeur)}
              >
                {o.icone ? <o.icone size={16} /> : <span className="menu-item-code">{CODES[o.valeur]}</span>}
                <span style={{ flex: 1, textAlign: 'left' }}>{o.libelle}</span>
                {actif ? <Check size={15} color="#2E7D32" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
