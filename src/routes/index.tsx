import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Layout } from '../components/Layout/Layout';
import { Dashboard } from '../pages/Dashboard';
import { Actions } from '../pages/Actions';
import { Recommendations } from '../pages/Recommendations';
import { Utilisateurs } from '../pages/Utilisateurs';
import { Profil } from '../pages/Profil';
import { Parcelles } from '../pages/Parcelles';
import { Cultures } from '../pages/Cultures';
import { Interventions } from '../pages/Interventions';
import { Observations } from '../pages/Observations';
import { Recoltes } from '../pages/Recoltes';

function Protected({ children }: Readonly<{ children: React.ReactNode }>) {
  const token = localStorage.getItem('haivoly_web_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthOutlet() {
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    // Les URL d'authentification partagent le même écran.
    element: <AuthOutlet />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'reset-password', element: <Login /> },
    ],
  },
  {
    path: '/',
    element: (
      <Protected>
        <Layout />
      </Protected>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'actions', element: <Actions /> },
      { path: 'actions/:id', element: <Actions /> },
      { path: 'recommandations', element: <Recommendations /> },
      { path: 'utilisateurs', element: <Utilisateurs /> },
      { path: 'profil', element: <Profil /> },
      { path: 'parcelles', element: <Parcelles /> },
      { path: 'cultures', element: <Cultures /> },
      { path: 'interventions', element: <Interventions /> },
      { path: 'observations', element: <Observations /> },
      { path: 'recoltes', element: <Recoltes /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
