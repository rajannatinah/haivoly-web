import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { Dashboard } from '../pages/Dashboard';
import { Actions } from '../pages/Actions';
import { Recommendations } from '../pages/Recommendations';
import { Login } from '../pages/Login';

function Protected({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('haivoly_web_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
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
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
