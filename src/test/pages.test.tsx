import { render, screen, within, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Parcelles } from '../pages/Parcelles';
import { Cultures } from '../pages/Cultures';
import { Interventions } from '../pages/Interventions';
import { Observations } from '../pages/Observations';
import { Recoltes } from '../pages/Recoltes';
import { Utilisateurs } from '../pages/Utilisateurs';
import { Profil } from '../pages/Profil';

// Le module API est remplacé intégralement : ces tests vérifient le rendu et
// les états, pas le transport HTTP (couvert par les tests backend).
vi.mock('../services/api', () => ({
  getParcelles: vi.fn(),
  getCultures: vi.fn(),
  getRecoltes: vi.fn(),
  getUtilisateurs: vi.fn(),
  getProfil: vi.fn(),
  updateProfil: vi.fn(),
  agregeInterventions: vi.fn(),
  agregeObservations: vi.fn(),
  normaliseListe: (r: unknown) => {
    if (Array.isArray(r)) return r;
    const data = (r as { data?: unknown } | null)?.data;
    if (Array.isArray(data)) return data;
    const pagine = data as { items?: unknown } | null;
    if (pagine && Array.isArray(pagine.items)) return pagine.items;
    return [];
  },
}));

const api = await import('../services/api');

// Enveloppe paginée réelle renvoyée par GET /parcelles, /cultures, /recoltes.
const pagine = (items: unknown[]) => ({
  success: true,
  data: { items, total: items.length, page: 1, limit: 20, totalPages: 1 },
  message: 'Opération réussie',
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Parcelles', () => {
  it('affiche les parcelles issues de l’enveloppe paginée data.items', async () => {
    vi.mocked(api.getParcelles).mockResolvedValue(
      pagine([
        {
          id: 'p1',
          nom: 'Parcelle Ankorondrano',
          superficie: 11696.93,
          typeSol: 'Argileux',
          statut: 'ACTIVE',
          pointsGPS: [{ latitude: -18.91, longitude: 47.52, ordre: 0 }],
          creeA: '2026-10-10T07:13:43.963Z',
        },
      ]),
    );

    render(<Parcelles />);

    expect(await screen.findByText('Parcelle Ankorondrano')).toBeInTheDocument();
    expect(screen.getByText('Argileux')).toBeInTheDocument();
    // Les sommets GPS sont comptés, pas inventés.
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('affiche l’erreur réelle du serveur, sans donnée de repli', async () => {
    vi.mocked(api.getParcelles).mockRejectedValue(
      Object.assign(new Error('boom'), {
        response: { data: { message: 'Token expiré' } },
      }),
    );

    render(<Parcelles />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Token expiré');
    expect(screen.queryByText('Parcelle Ankorondrano')).not.toBeInTheDocument();
  });

  it('affiche un état vide explicite quand il n’y a rien', async () => {
    vi.mocked(api.getParcelles).mockResolvedValue(pagine([]));

    render(<Parcelles />);

    expect(
      await screen.findByText('Aucune parcelle enregistrée pour ce compte.'),
    ).toBeInTheDocument();
  });
});

describe('Cultures', () => {
  it('affiche la culture et son statut calculé par le backend', async () => {
    vi.mocked(api.getCultures).mockResolvedValue(
      pagine([
        {
          id: 'c1',
          nom: 'Riz X265',
          variete: 'X265',
          statut: 'RECOLTEE',
          datePlantation: '2026-09-01',
          datePrevueRecolte: '2027-01-15',
          parcelle: { id: 'p1', nom: 'Parcelle Ankorondrano' },
        },
      ]),
    );

    render(<Cultures />);

    expect(await screen.findByText('Riz X265')).toBeInTheDocument();
    // « RECOLTEE » apparaît aussi dans l'<option>' du filtre de statut :
    // on cible donc la ligne du tableau, pas le document entier.
    const ligne = screen.getByText('Riz X265').closest('tr') as HTMLElement;
    expect(within(ligne).getByText('RECOLTEE')).toBeInTheDocument();
    expect(within(ligne).getByText('Parcelle Ankorondrano')).toBeInTheDocument();
  });

  it('n’affiche pas de valeur inventée pour une date absente', async () => {
    vi.mocked(api.getCultures).mockResolvedValue(
      pagine([{ id: 'c1', nom: 'Sans dates', statut: 'PLANIFIEE' }]),
    );

    render(<Cultures />);

    expect(await screen.findByText('Sans dates')).toBeInTheDocument();
    // formateDate renvoie un tiret cadratin, jamais une date fictive.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});

describe('Interventions', () => {
  it('affiche les interventions agrégées depuis les cultures', async () => {
    vi.mocked(api.agregeInterventions).mockResolvedValue({
      items: [
        {
          id: 'i1',
          type: 'IRRIGATION',
          description: 'Irrigation du matin',
          produit: 'Eau',
          quantite: 500,
          unite: 'L',
          cout: 25000,
          cultureNom: 'Riz X265',
          date: '2026-10-01T08:00:00.000Z',
        },
      ],
      erreurs: [],
    });

    render(<Interventions />);

    expect(await screen.findByText('IRRIGATION')).toBeInTheDocument();
    expect(screen.getByText('Irrigation du matin')).toBeInTheDocument();
    expect(screen.getByText('Riz X265')).toBeInTheDocument();
  });

  it('signale un affichage partiel quand une culture est injoignable', async () => {
    vi.mocked(api.agregeInterventions).mockResolvedValue({
      items: [{ id: 'i1', type: 'ENTRETIEN', cultureNom: 'Riz X265' }],
      erreurs: ['culture c2 : timeout'],
    });

    render(<Interventions />);

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Affichage partiel',
    );
    expect(screen.getByText('culture c2 : timeout')).toBeInTheDocument();
  });
});

describe('Observations', () => {
  it('affiche la description et la culture, seuls champs réels de l’entité', async () => {
    vi.mocked(api.agregeObservations).mockResolvedValue({
      items: [
        {
          id: 'o1',
          description: 'Taches brunes sur les feuilles basses',
          date: '2026-10-05T08:00:00.000Z',
          cultureNom: 'Riz X265',
        },
      ],
      erreurs: [],
    });

    render(<Observations />);

    expect(
      await screen.findByText('Taches brunes sur les feuilles basses'),
    ).toBeInTheDocument();
    expect(screen.getByText('Riz X265')).toBeInTheDocument();
  });
});

describe('Recoltes', () => {
  it('calcule la marge brute à partir des lignes, sans valeur codée en dur', async () => {
    vi.mocked(api.getRecoltes).mockResolvedValue(
      pagine([
        {
          id: 'r1',
          dateRecolte: '2027-01-15',
          quantite: 1200.5,
          unite: 'kg',
          prixVente: 4500000,
          coutRecolte: 800000,
          culture: { id: 'c1', nom: 'Riz X265' },
        },
      ]),
    );

    render(<Recoltes />);

    expect(await screen.findByText('Riz X265')).toBeInTheDocument();
    // 4 500 000 - 800 000 = 3 700 000, formaté en fr-FR.
    expect(screen.getByText(/3\s?700\s?000/)).toBeInTheDocument();
  });
});

describe('Utilisateurs', () => {
  it('liste tous les comptes du périmètre, activés ou en attente', async () => {
    vi.mocked(api.getUtilisateurs).mockResolvedValue([
      {
        id: 'u1',
        nom: 'Rakoto',
        prenom: 'Bao',
        nomComplet: 'Bao Rakoto',
        username: 'bao.rakoto',
        email: 'bao@haivoly.mg',
        role: 'AGRICULTEUR',
        estVerifie: true,
      },
      {
        id: 'u2',
        nom: 'Rasoa',
        prenom: null,
        nomComplet: 'Rasoa',
        username: 'rasoa',
        role: 'PROPRIETAIRE',
        estVerifie: false,
      },
    ]);

    render(<Utilisateurs />);

    expect(await screen.findByText('Bao Rakoto')).toBeInTheDocument();
    expect(screen.getByText('@bao.rakoto')).toBeInTheDocument();
    expect(screen.getByText('bao@haivoly.mg')).toBeInTheDocument();
    expect(screen.getByText('AGRICULTEUR')).toBeInTheDocument();
    expect(screen.getByText('Activé')).toBeInTheDocument();
    // Un compte non confirmé reste visible, marqué « En attente ».
    const ligne = screen.getByText('Rasoa').closest('tr') as HTMLElement;
    expect(within(ligne).getByText('En attente')).toBeInTheDocument();
  });

  it('affiche un état vide explicite quand le périmètre est vide', async () => {
    vi.mocked(api.getUtilisateurs).mockResolvedValue([]);

    render(<Utilisateurs />);

    expect(
      await screen.findByText('Aucun utilisateur dans votre périmètre.'),
    ).toBeInTheDocument();
  });
});

const profil = {
  id: 'u1',
  nom: 'Rakoto',
  prenom: 'Bao',
  username: 'bao.rakoto',
  email: 'bao@haivoly.mg',
  telephone: '+261 34 00 000 00',
  role: 'PROPRIETAIRE',
  estVerifie: true,
  langue: 'fr',
  motDePasseProvisoire: false,
  creeA: '2026-01-15T00:00:00.000Z',
};

describe('Profil', () => {
  it('precharge le formulaire avec les données réelles du compte', async () => {
    vi.mocked(api.getProfil).mockResolvedValue(profil);

    render(<Profil />);

    expect(await screen.findByDisplayValue('Rakoto')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bao')).toBeInTheDocument();
    expect(screen.getByDisplayValue('bao.rakoto')).toBeInTheDocument();
    expect(screen.getByDisplayValue('bao@haivoly.mg')).toBeInTheDocument();
    expect(screen.getByText('PROPRIETAIRE')).toBeInTheDocument();
    expect(screen.getByText('Activé')).toBeInTheDocument();
  });

  it('enregistre les modifications via PATCH /users/me et confirme', async () => {
    vi.mocked(api.getProfil).mockResolvedValue(profil);
    vi.mocked(api.updateProfil).mockResolvedValue({ ...profil, nom: 'Rakoto A' });

    render(<Profil />);

    const champNom = await screen.findByDisplayValue('Rakoto');
    fireEvent.change(champNom, { target: { value: 'Rakoto A' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    expect(await screen.findByText('Profil mis à jour avec succès.')).toBeInTheDocument();
    expect(api.updateProfil).toHaveBeenCalledWith(
      expect.objectContaining({ nom: 'Rakoto A', langue: 'fr' }),
    );
  });

  it('affiche l’erreur réelle du serveur quand le profil ne charge pas', async () => {
    vi.mocked(api.getProfil).mockRejectedValue(
      Object.assign(new Error('boom'), {
        response: { data: { message: 'Token expiré' } },
      }),
    );

    render(<Profil />);

    expect(
      await screen.findByText('Impossible de charger votre profil.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Token expiré');
  });
});
