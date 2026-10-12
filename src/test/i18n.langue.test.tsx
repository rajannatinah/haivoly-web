import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CHOIX_SYSTEME,
  LANGUE_PAR_DEFAUT,
  baliseDeFormatage,
  changerLangue,
  formaterDate,
  formaterDevise,
  initialiserI18n,
  langueDuSysteme,
  lireChoix,
  resoudreChoix,
  resoudreLangue,
} from '../i18n';
import { SelecteurLangue } from '../components/ui/SelecteurLangue';

/**
 * Le sélecteur de langue doit produire un changement immédiat, persistant, et
 * sans rechargement : c'est le comportement exigé par le module i18n.
 */

const CLE = 'haivoly_web:langue';

afterEach(async () => {
  localStorage.clear();
  await changerLangue(LANGUE_PAR_DEFAUT);
});

describe('résolution de la langue', () => {
  it('ramène une balise régionale à sa langue supportée', () => {
    expect(resoudreLangue('fr-FR')).toBe('fr');
    expect(resoudreLangue('en-US')).toBe('en');
    expect(resoudreLangue('mg')).toBe('mg');
  });

  it('retombe sur le français pour une langue non supportée ou absente', () => {
    expect(resoudreLangue('zh-CN')).toBe(LANGUE_PAR_DEFAUT);
    expect(resoudreLangue(null)).toBe(LANGUE_PAR_DEFAUT);
    expect(resoudreLangue('')).toBe(LANGUE_PAR_DEFAUT);
  });

  it('`system` suit la langue du navigateur', () => {
    /**
     * `setup.ts` force `fr` au démarrage des tests, ce qui écrit dans le
     * stockage : on repart d'un stockage vide pour observer le comportement
     * par défaut réel.
     */
    localStorage.clear();
    expect(lireChoix()).toBe(CHOIX_SYSTEME);
    expect(resoudreChoix(CHOIX_SYSTEME)).toBe(langueDuSysteme());
  });
});

describe('changement de langue', () => {
  it('change immédiatement, persiste et met à jour <html lang>', async () => {
    await initialiserI18n();

    await changerLangue('en');
    expect(screen === undefined).toBe(false); // garde : l'environnement DOM est actif
    expect(lireChoix()).toBe('en');
    expect(document.documentElement.lang).toBe('en');

    await changerLangue('mg');
    expect(lireChoix()).toBe('mg');
    expect(document.documentElement.lang).toBe('mg');
  });

  it('survit à une relecture du stockage (persistance inter-sessions)', async () => {
    await initialiserI18n();
    await changerLangue('en');
    expect(localStorage.getItem(CLE)).toBe('en');
    expect(resoudreChoix(lireChoix())).toBe('en');
  });

  it('le sélecteur affiche les trois langues et l’option système', async () => {
    await initialiserI18n();
    await changerLangue('fr');

    render(<SelecteurLangue />);
    await waitFor(() => expect(screen.getByLabelText('Choisir la langue de l’interface')).toBeInTheDocument());

    expect(screen.getByText('Système')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('Anglais')).toBeInTheDocument();
    expect(screen.getByText('Malgache')).toBeInTheDocument();
  });
});

describe('formatage localisé', () => {
  it('mg utilise fr-MG, comme le mobile', () => {
    expect(baliseDeFormatage('mg')).toBe('fr-MG');
    expect(baliseDeFormatage('en')).toBe('en-US');
    expect(baliseDeFormatage('fr')).toBe('fr-FR');
  });

  it('formate une date selon la langue active', async () => {
    await initialiserI18n();
    await changerLangue('fr');
    const enFrancais = formaterDate('2026-03-12');

    await changerLangue('en');
    const enAnglais = formaterDate('2026-03-12');

    expect(enFrancais).toBe('12/03/2026');
    expect(enAnglais).toBe('03/12/2026');
  });

  it('renvoie un tiret pour une valeur absente ou invalide', () => {
    expect(formaterDate(null)).toBe('—');
    expect(formaterDate('pas-une-date')).toBe('—');
    expect(formaterDevise(null)).toBe('—');
  });

  it('formate une devise en ariary', async () => {
    await initialiserI18n();
    await changerLangue('fr');
    expect(formaterDevise(12500)).toMatch(/Ar$/);
    expect(formaterDevise(12500)).not.toBe('—');
  });
});
