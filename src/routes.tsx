import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { RequireRole } from './components/auth/RequireRole';
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
const TiposProgramacionList = lazy(() => import('./components/admin/TiposProgramacionList').then(m => ({ default: m.TiposProgramacionList })));
const ProgramacionHome = lazy(() => import('./components/programacion/ProgramacionHome').then(m => ({ default: m.ProgramacionHome })));

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
  }, [id, getCancion]);

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
        <Route path="/cancion/nueva" element={<Layout><CancionForm /></Layout>} />
        <Route path="/cancion/:id" element={<Layout><CancionDetalle /></Layout>} />
        <Route path="/cancion/:id/editar" element={<Layout><CancionEditWrapper /></Layout>} />
        <Route path="/cancion/:id/presentacion" element={<CancionPresentacion />} />

        <Route path="/programacion" element={<ProgramacionHome />} />

        <Route path="/administracion" element={<RequireRole check={r => r.isAdmin}><AdminHome /></RequireRole>} />
        <Route path="/administracion/usuarios" element={<RequireRole check={r => r.isAdmin}><UsuarioList /></RequireRole>} />
        <Route path="/administracion/tipos-programacion" element={<RequireRole check={r => r.canGestionarTiposProgramacion}><TiposProgramacionList /></RequireRole>} />
      </Routes>
    </Suspense>
  );
}
