import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AuthSwitch from '../components/ui/auth-switch';

vi.mock('../services/api', () => ({
  loginWeb: vi.fn(),
  registerWeb: vi.fn(),
}));

function renderAuth(initialPath = '/login') {
  const router = createMemoryRouter(
    [
      {
        element: <Outlet />,
        children: [
          { path: 'login', element: <AuthSwitch /> },
          { path: 'register', element: <AuthSwitch /> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe('AuthSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ouvre le mode inscription depuis la connexion et conserve les champs', () => {
    const router = renderAuth('/login');

    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
    expect(document.querySelector('.auth-switch__panel-content--left .lucide-sprout')).toBeInTheDocument();
    expect(document.querySelector('.auth-switch__form--sign-in .lucide-sprout')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Créer un compte' }));

    expect(router.state.location.pathname).toBe('/register');
    expect(screen.getByRole('heading', { name: 'Créer votre compte' })).toBeInTheDocument();

    fireEvent.change(document.querySelector('#haivoly-signup-nom') as HTMLInputElement, {
      target: { value: 'Rakoto' },
    });
    fireEvent.click(
      document.querySelector('.auth-switch__panel--right .auth-switch__panel-button') as HTMLButtonElement,
    );

    expect(router.state.location.pathname).toBe('/login');
    expect(document.querySelector('#haivoly-signup-nom')).toHaveValue('Rakoto');
  });

  it('affiche directement le mode inscription sur /register', () => {
    renderAuth('/register');

    expect(screen.getByRole('heading', { name: 'Créer votre compte' })).toBeInTheDocument();
    expect(document.querySelector('.auth-switch__card')).toHaveClass('is-sign-up');
  });
});
