import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ProtectedRoute>
            <AppRoutes />
          </ProtectedRoute>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
