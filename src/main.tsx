import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initialiserI18n } from './i18n';

void initialiserI18n().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
