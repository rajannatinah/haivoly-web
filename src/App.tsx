import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ConfirmProvider } from './components/ui/ConfirmProvider';
import './styles/globals.css';

export default function App() {
  return (
    <ConfirmProvider>
      <RouterProvider router={router} />
    </ConfirmProvider>
  );
}
