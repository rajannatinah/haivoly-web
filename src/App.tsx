import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ConfirmProvider } from './components/ui/ConfirmProvider';
import { UserProvider } from './components/Layout/UserProvider';
import './styles/globals.css';

export default function App() {
  return (
    <ConfirmProvider>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </ConfirmProvider>
  );
}
