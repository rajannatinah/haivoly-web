import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

import { changerLangue, initialiserI18n } from '../i18n';

/**
 * i18n doit etre prete avant les tests : sans elle, `t()` renvoie la cle brute.
 * La langue est egalement forcee a `fr` : jsdom expose navigator.language =
 * 'en-US' et localStorage est vide, donc le repli systeme resoudrait `en` et
 * les assertions redigees en francais echoueraient a tort.
 */
beforeAll(async () => {
  await initialiserI18n();
  await changerLangue('fr');
});

afterEach(() => cleanup());

// jsdom n'implémente pas matchMedia ; le Layout l'utilise.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
