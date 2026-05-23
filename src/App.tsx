import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './components/Home';
import { CancionList } from './components/canciones/CancionList';
import { CancionForm } from './components/canciones/CancionForm';
import { CancionDetalle } from './components/canciones/CancionDetalle';
import { CancionPresentacion } from './components/canciones/CancionPresentacion';
import { AdminHome } from './components/admin/AdminHome';
import { UsuarioList } from './components/admin/UsuarioList';
import { useCanciones } from './hooks/useCanciones';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import type { Cancion } from './domain';

function CancionEditWrapper() {
  const { id } = useParams<{ id: string }>();
  const { getCancion } = useCanciones();
  const [cancion, setCancion] = useState<Cancion | null>(null);

  useEffect(() => {
    if (id) getCancion(id).then(setCancion);
  }, [id]);

  if (!cancion) return null;
  return <CancionForm cancionExistente={cancion} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedRoute>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Canciones */}
            <Route path="/canciones" element={
              <Layout>
                <CancionList />
              </Layout>
            } />
            <Route path="/canciones/buscar" element={
              <Layout>
                <CancionList />
              </Layout>
            } />
            <Route path="/cancion/nueva" element={
              <Layout hideBottomNav>
                <CancionForm />
              </Layout>
            } />
            <Route path="/cancion/:id" element={
              <Layout hideBottomNav>
                <CancionDetalle />
              </Layout>
            } />
            <Route path="/cancion/:id/editar" element={
              <Layout hideBottomNav>
                <CancionEditWrapper />
              </Layout>
            } />
            <Route path="/cancion/:id/presentacion" element={
              <CancionPresentacion />
            } />

            {/* Administración */}
            <Route path="/administracion" element={
              <AdminHome />
            } />
            <Route path="/administracion/usuarios" element={
              <UsuarioList />
            } />
          </Routes>
        </ProtectedRoute>
      </AuthProvider>
    </BrowserRouter>
  );
}
