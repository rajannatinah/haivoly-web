import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initialiserI18n } from './i18n';

/**
 * i18n est initialisé avant le premier rendu : un rendu immédiat afficherait
 * les clés brutes une fraction de seconde avant que les traductions arrivent.
 */
void initialiserI18n().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
