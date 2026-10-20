import { useTranslation } from 'react-i18next';
import { Image as ImageIcon } from 'lucide-react';
import type { Photo } from '../../types';
import { mediaUrl } from '../../utils/mediaUrl';

interface Props {
  photos?: Photo[] | null;
  /** Largeur d'une vignette (px). */
  taille?: number;
}

export function GaleriePhotos({ photos, taille = 96 }: Readonly<Props>) {
  const { t } = useTranslation();
  const valides = (photos ?? [])
    .map((photo) => ({ photo, src: mediaUrl(photo.url) }))
    .filter((entry): entry is { photo: Photo; src: string } => entry.src !== null);

  if (valides.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {valides.map(({ photo, src }) => (
        <a
          key={photo.id}
          href={src}
          target="_blank"
          rel="noreferrer"
          title={t('detail.ouvrirImage')}
          style={{
            display: 'block',
            width: taille,
            height: taille,
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid #EAECF0',
            background: '#F9FAFB',
            flexShrink: 0,
          }}
        >
          <img
            src={src}
            alt={t('detail.photoJointe')}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </a>
      ))}
    </div>
  );
}

/** Compteur de photos pour les listes (colonne « Photos » des tableaux). */
export function CompteurPhotos({ photos }: Readonly<{ photos?: Photo[] | null }>) {
  const { t } = useTranslation();
  const nombre = photos?.length ?? 0;
  if (nombre === 0) return <span style={{ color: '#98A2B3' }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#344054' }}>
      <ImageIcon size={14} color="#2E7D32" />
      {t('detail.nombrePhotos', { count: nombre })}
    </span>
  );
}
