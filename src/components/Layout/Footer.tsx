import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer style={{ borderTop: '1px solid #EAECF0', background: 'white', marginTop: 32 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#98A2B3' }}>
        <span>{t('pied.copyright', { annee: new Date().getFullYear() })}</span>
        <span>{t('pied.slogan')}</span>
      </div>
    </footer>
  );
}
