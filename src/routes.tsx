import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DotLoader } from './components/ui/DotLoader';
import { useCanciones } from './hooks/useCanciones';
import type { Cancion } from './domain';

const Home = lazy(() => import('./components/Home').then(m => ({ default: m.Home })));
const CancionList = lazy(() => import('./components/canciones/CancionList').then(m => ({ default: m.CancionList })));
const CancionForm = lazy(() => import('./components/canciones/CancionForm').then(m => ({ default: m.CancionForm })));
const CancionDetalle = lazy(() => import('./components/canciones/CancionDetalle').then(m => ({ default: m.CancionDetalle })));
const CancionPresentacion = lazy(() => import('./components/canciones/CancionPresentacion').then(m => ({ default: m.CancionPresentacion })));
const AdminHome = lazy(() => import('./components/admin/AdminHome').then(m => ({ default: m.AdminHome })));
const UsuarioList = lazy(() => import('./components/admin/UsuarioList').then(m => ({ default: m.UsuarioList })));

function LazyFallback() {
  return (
    <div className="min-h-svh bg-app flex items-center justify-center">
      <DotLoader />
    </div>
  );
}

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

export function AppRoutes() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/canciones" element={<Layout><CancionList /></Layout>} />
        <Route path="/canciones/buscar" element={<Layout><CancionList /></Layout>} />
        <Route path="/cancion/nueva" element={<Layout hideBottomNav><CancionForm /></Layout>} />
        <Route path="/cancion/:id" element={<Layout hideBottomNav><CancionDetalle /></Layout>} />
        <Route path="/cancion/:id/editar" element={<Layout hideBottomNav><CancionEditWrapper /></Layout>} />
        <Route path="/cancion/:id/presentacion" element={<CancionPresentacion />} />

        <Route path="/administracion" element={<AdminHome />} />
        <Route path="/administracion/usuarios" element={<UsuarioList />} />
      </Routes>
    </Suspense>
  );
}
