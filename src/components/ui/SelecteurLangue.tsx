import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

import {
  CHOIX_SYSTEME,
  LANGUES_DISPONIBLES,
  changerLangue,
  lireChoix,
  resoudreLangue,
  type ChoixLangue,
} from '../../i18n';

export function SelecteurLangue() {
  const { t, i18n } = useTranslation();
  const choix: ChoixLangue = lireChoix();
  const effective =
    choix === CHOIX_SYSTEME ? resoudreLangue(i18n.language) : choix;

  const options: { valeur: ChoixLangue; libelle: string }[] = [
    { valeur: CHOIX_SYSTEME, libelle: t('langue.systeme') },
    ...LANGUES_DISPONIBLES.map((l) => ({
      valeur: l as ChoixLangue,
      libelle: t(`langue.${l}`),
    })),
  ];

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        color: '#344054',
      }}
    >
      <Languages size={16} aria-hidden />
      <span className="sr-only">{t('langue.aria')}</span>
      <select
        className="input"
        style={{ minWidth: 130, height: 40 }}
        aria-label={t('langue.aria')}
        value={effective}
        onChange={(e) => void changerLangue(e.target.value as ChoixLangue)}
      >
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}
