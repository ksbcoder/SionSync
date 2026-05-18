# Plan Técnico — App "SionSync"

## Descripción General

Aplicación web **mobile-first** para almacenar, editar y gestionar canciones de alabanza. El uso principal será desde dispositivos móviles (celulares y tablets), por lo que toda la interfaz debe diseñarse primero para pantallas pequeñas y escalar hacia escritorio. Cada canción se compone de secciones tipificadas (verso, coro, puente, etc.) y cada sección puede tener opcionalmente notas/acordes asociados. La app es de uso casual con poco tráfico.

---

## Principios de Diseño Mobile-First

### CRÍTICO — Toda decisión de UI debe priorizar la experiencia móvil:

1. **Viewport y meta tags:** Incluir `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">` para evitar zoom indeseado en inputs.
2. **Touch targets:** Todos los botones e interactivos deben tener mínimo `44x44px` (idealmente `48x48px`). Usar `min-h-[44px] min-w-[44px]` en Tailwind.
3. **Diseño base en columna:** Todo el layout es vertical por defecto (`flex-col`). Solo se usa row/grid en pantallas `md:` o superiores.
4. **Tipografía legible:** Fuente base `16px` mínimo en inputs (evita zoom en iOS). Letra de canciones mínimo `18px`, acordes `16px`.
5. **Spacing generoso:** Padding mínimo `p-4` en contenedores, gap mínimo `gap-3` entre elementos interactivos para evitar toques accidentales.
6. **Navegación inferior:** Usar una barra de navegación fija en la parte inferior de la pantalla (bottom nav) en móvil, tipo app nativa. En desktop puede ser header superior.
7. **Formularios adaptados:** Inputs de ancho completo (`w-full`), labels encima del campo, botones de acción de ancho completo en móvil.
8. **Modales como bottom sheets:** En móvil, los modales/formularios de edición deben aparecer como bottom sheets (panel que sube desde abajo) en vez de modales centrados. Usar `fixed bottom-0 inset-x-0 rounded-t-2xl` con animación de slide-up.
9. **Gestos y swipe:** Considerar swipe-to-delete o swipe-to-edit en las tarjetas de canciones y secciones usando touch events.
10. **Estados de carga:** Usar skeletons en vez de spinners, optimizados para el ancho móvil.
11. **Safe areas:** Respetar `env(safe-area-inset-bottom)` para dispositivos con notch/barra de navegación gestual. Aplicar `pb-[env(safe-area-inset-bottom)]` en la bottom nav.
12. **PWA ready:** Incluir `manifest.json` con `display: standalone`, iconos, y `theme_color` para que se pueda instalar como app desde el navegador. Registrar un Service Worker básico para cache offline.

---

## Stack Técnico

- **Frontend:** React 18+ con TypeScript
- **Estilos:** Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + API REST auto-generada)
- **Despliegue:** Vercel (tier gratuito)
- **Autenticación:** No incluida en el MVP. Preparar la estructura para agregarla después con Supabase Auth.

---

## Modelo de Datos (Supabase/PostgreSQL)

### Tabla: `canciones`

| Columna       | Tipo         | Restricciones                  |
|---------------|--------------|--------------------------------|
| id            | uuid         | PK, default gen_random_uuid() |
| titulo        | text         | NOT NULL                       |
| autor         | text         | NULL (opcional)                |
| tonalidad     | text         | NULL (opcional)                |
| tempo         | integer      | NULL (opcional, BPM)           |
| created_at    | timestamptz  | default now()                  |
| updated_at    | timestamptz  | default now()                  |

### Tabla: `secciones`

| Columna     | Tipo         | Restricciones                          |
|-------------|--------------|----------------------------------------|
| id          | uuid         | PK, default gen_random_uuid()         |
| cancion_id  | uuid         | FK → canciones(id) ON DELETE CASCADE   |
| tipo        | text         | NOT NULL, CHECK (tipo IN ('verso', 'coro', 'pre-coro', 'puente', 'intro', 'outro', 'final', 'otro')) |
| orden       | integer      | NOT NULL, default 0                    |
| letra       | text         | NOT NULL, default ''                   |
| created_at  | timestamptz  | default now()                          |

### Tabla: `notas`

| Columna     | Tipo         | Restricciones                          |
|-------------|--------------|----------------------------------------|
| id          | uuid         | PK, default gen_random_uuid()         |
| seccion_id  | uuid         | FK → secciones(id) ON DELETE CASCADE   |
| orden       | integer      | NOT NULL, default 0                    |
| contenido   | text         | NOT NULL (ej: "Am - F - C - G")        |
| created_at  | timestamptz  | default now()                          |

### SQL de creación

```sql
-- Tabla canciones
CREATE TABLE canciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  autor text,
  tonalidad text,
  tempo integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla secciones
CREATE TABLE secciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cancion_id uuid NOT NULL REFERENCES canciones(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('verso', 'coro', 'pre-coro', 'puente', 'intro', 'outro', 'final', 'otro')),
  orden integer NOT NULL DEFAULT 0,
  letra text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Tabla notas
CREATE TABLE notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seccion_id uuid NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
  orden integer NOT NULL DEFAULT 0,
  contenido text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_secciones_cancion_id ON secciones(cancion_id);
CREATE INDEX idx_notas_seccion_id ON notas(seccion_id);

-- Trigger para actualizar updated_at en canciones
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_canciones_updated_at
  BEFORE UPDATE ON canciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Políticas RLS (Row Level Security)

Dado que no hay autenticación en el MVP, deshabilitar RLS o crear políticas que permitan acceso público:

```sql
ALTER TABLE canciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE secciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso público canciones" ON canciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público secciones" ON secciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público notas" ON notas FOR ALL USING (true) WITH CHECK (true);
```

---

## Estructura del Proyecto

```
sion-sync/
├── public/
│   ├── manifest.json                   # PWA manifest
│   ├── icons/                          # Iconos PWA (192x192, 512x512)
│   └── sw.js                           # Service Worker básico
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx              # Header desktop / oculto en móvil
│   │   │   ├── BottomNav.tsx           # Barra de navegación inferior (solo móvil)
│   │   │   ├── Layout.tsx              # Layout principal con safe areas
│   │   │   └── BottomSheet.tsx         # Componente reutilizable bottom sheet para modales móviles
│   │   ├── canciones/
│   │   │   ├── CancionList.tsx          # Lista de canciones con buscador
│   │   │   ├── CancionCard.tsx          # Tarjeta individual en la lista
│   │   │   ├── CancionForm.tsx          # Formulario crear/editar canción
│   │   │   ├── CancionDetalle.tsx       # Vista completa de una canción
│   │   │   └── CancionPresentacion.tsx  # Modo lectura/presentación
│   │   ├── secciones/
│   │   │   ├── SeccionItem.tsx          # Una sección dentro del detalle
│   │   │   ├── SeccionForm.tsx          # Formulario crear/editar sección
│   │   │   └── SeccionBadge.tsx         # Badge visual del tipo de sección
│   │   ├── notas/
│   │   │   ├── NotasDisplay.tsx         # Muestra acordes de una sección
│   │   │   └── NotasForm.tsx            # Formulario crear/editar notas
│   │   └── ui/
│   │       ├── TouchButton.tsx          # Botón con min 44x44px touch target
│   │       ├── SwipeableCard.tsx        # Tarjeta con soporte swipe (eliminar/editar)
│   │       ├── Skeleton.tsx             # Skeleton loader para estados de carga
│   │       └── EmptyState.tsx           # Estado vacío con ilustración
│   ├── lib/
│   │   └── supabase.ts                 # Cliente Supabase
│   ├── hooks/
│   │   ├── useCanciones.ts             # Hook CRUD canciones
│   │   ├── useSecciones.ts             # Hook CRUD secciones
│   │   ├── useNotas.ts                 # Hook CRUD notas
│   │   └── useMediaQuery.ts            # Hook para detectar móvil vs desktop
│   ├── types/
│   │   └── index.ts                    # Tipos TypeScript
│   ├── utils/
│   │   └── constants.ts                # Constantes (tipos de sección, colores)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                       # Incluir safe-area CSS y estilos base móvil
├── .env.local                          # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Tipos TypeScript

```typescript
// src/types/index.ts

export type TipoSeccion = 'verso' | 'coro' | 'pre-coro' | 'puente' | 'intro' | 'outro' | 'final' | 'otro';

export interface Cancion {
  id: string;
  titulo: string;
  autor: string | null;
  tonalidad: string | null;
  tempo: number | null;
  created_at: string;
  updated_at: string;
  secciones?: Seccion[];
}

export interface Seccion {
  id: string;
  cancion_id: string;
  tipo: TipoSeccion;
  orden: number;
  letra: string;
  created_at: string;
  notas?: Nota[];
}

export interface Nota {
  id: string;
  seccion_id: string;
  orden: number;
  contenido: string;
  created_at: string;
}

export interface CancionInsert {
  titulo: string;
  autor?: string | null;
  tonalidad?: string | null;
  tempo?: number | null;
}

export interface SeccionInsert {
  cancion_id: string;
  tipo: TipoSeccion;
  orden: number;
  letra: string;
}

export interface NotaInsert {
  seccion_id: string;
  orden: number;
  contenido: string;
}
```

---

## Constantes y Configuración Visual

```typescript
// src/utils/constants.ts

export const TIPOS_SECCION = {
  verso:      { label: 'Verso',     color: 'bg-blue-100 text-blue-800',    border: 'border-blue-300' },
  coro:       { label: 'Coro',      color: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-300' },
  'pre-coro': { label: 'Pre-Coro',  color: 'bg-orange-100 text-orange-800', border: 'border-orange-300' },
  puente:     { label: 'Puente',    color: 'bg-purple-100 text-purple-800', border: 'border-purple-300' },
  intro:      { label: 'Intro',     color: 'bg-green-100 text-green-800',   border: 'border-green-300' },
  outro:      { label: 'Outro',     color: 'bg-teal-100 text-teal-800',     border: 'border-teal-300' },
  final:      { label: 'Final',     color: 'bg-red-100 text-red-800',       border: 'border-red-300' },
  otro:       { label: 'Otro',      color: 'bg-gray-100 text-gray-800',     border: 'border-gray-300' },
} as const;

export const TONALIDADES = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm',
  'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm',
];
```

---

## Pantallas y Flujos (Mobile-First)

### 1. Pantalla de Inicio — Lista de Canciones (`/`)

**Móvil (diseño base):**
- Barra de búsqueda sticky en la parte superior con icono de lupa, `w-full`, `h-12`, `text-base` (16px para evitar zoom en iOS).
- Lista vertical de tarjetas, cada una mostrando: título (font-semibold text-lg), autor y tonalidad en texto secundario, cantidad de secciones como badge.
- Las tarjetas soportan swipe-left para revelar botón de eliminar (fondo rojo con icono de basura).
- Botón flotante (FAB) circular en esquina inferior derecha: "+ Nueva Canción". Tamaño `56x56px`, posicionado con `fixed bottom-20 right-4` (encima de la bottom nav). Usar `z-50`.
- Al tocar una tarjeta → navegar a `/cancion/:id`.
- Bottom nav fija con: Inicio (icono casa), Buscar (icono lupa, abre búsqueda avanzada), Configuración (icono engranaje, para futuro).

**Desktop (md: y superior):**
- Layout en grid de 2-3 columnas para las tarjetas.
- Búsqueda en el header superior.
- Sin FAB, botón "Nueva Canción" en el header.

### 2. Pantalla de Crear/Editar Canción (`/cancion/nueva` y `/cancion/:id/editar`)

**Móvil:**
- Pantalla completa tipo formulario. Header con botón "← Atrás" y título "Nueva Canción" o "Editar Canción".
- Campos en columna, ancho completo: Título (`input text-base`, obligatorio), Autor (`input`, opcional), Tonalidad (`select nativo del OS` para mejor UX móvil, opcional), Tempo en BPM (`input type="number"`, opcional).
- Botones de acción en la parte inferior, fijos: "Guardar" (botón primario, `w-full h-12`) y "Cancelar" (botón secundario, `w-full h-12`).
- NO usar bottom nav en esta pantalla (es un flujo modal).

**Desktop:**
- Formulario centrado con max-width `max-w-lg`.

### 3. Pantalla de Detalle de Canción (`/cancion/:id`)

**Móvil:**
- Header sticky con: botón "← Atrás", título de la canción truncado con ellipsis, menú de 3 puntos (⋮) que abre opciones: Editar, Eliminar, Modo presentación.
- Debajo del header: subtítulo con autor, tonalidad, tempo en chips/pills horizontales con scroll horizontal si no caben.
- Lista vertical de secciones, cada una como tarjeta:
  - Badge de color con tipo en la esquina superior izquierda (ej: "Coro" en amarillo).
  - Letra en fuente legible (`text-lg leading-relaxed`, mínimo 18px).
  - Acordes/notas encima de la letra en color destacado y `font-mono text-base` si existen.
  - Botones de acción de sección en fila: iconos de editar, notas, subir, bajar, eliminar. Todos con touch target `44x44px`.
  - Swipe-left en sección para revelar eliminar.
- Al editar una sección → se abre un **bottom sheet** desde abajo con: select de tipo, textarea para letra (min-height `150px`), botones Guardar/Cancelar.
- Al agregar/editar notas → bottom sheet con textarea para acordes.
- Botón "＋ Agregar Sección" al final de la lista, `w-full h-12`, con borde punteado.
- NO mostrar bottom nav en esta pantalla (ya tiene navegación propia con back button).

**Desktop:**
- Layout más ancho, secciones con botones de acción visibles al hover.
- Modales centrados en vez de bottom sheets.

### 4. Modo Presentación (`/cancion/:id/presentacion`)

**Móvil (optimización principal):**
- Pantalla completa, ocultar status bar si es PWA (`display: standalone`).
- Fondo oscuro (`bg-gray-950`) para reducir brillo y ahorrar batería en OLED.
- Título centrado en fuente grande (`text-2xl font-bold text-white`).
- Cada sección con badge de tipo semi-transparente.
- Letra en fuente grande, legible: `text-xl leading-loose text-gray-100`.
- Acordes en `text-lg font-mono text-amber-400` encima de cada línea de letra.
- Scroll vertical suave, sin paginación. Touch para scroll natural.
- Botón de salir: icono X en esquina superior derecha, semi-transparente hasta que se toca. Tamaño `48x48px`.
- **Auto-scroll opcional:** botón para activar scroll automático a velocidad configurable (útil cuando se está tocando un instrumento y no se puede hacer scroll manual).
- Bloqueo de rotación: sugerir al usuario que use portrait, pero funcionar en ambas orientaciones.

**Desktop:**
- Mismo diseño pero con fuentes más grandes y más padding lateral.

---

## Componente BottomSheet (Especificación)

Componente reutilizable para formularios y acciones en móvil:

```typescript
// Props
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
```

Comportamiento:
- Aparece desde abajo con animación `transform translate-y-full → translate-y-0` (300ms ease-out).
- Overlay oscuro semi-transparente detrás (`bg-black/50`), al tocar cierra el sheet.
- Handle visual (barra gris) en la parte superior para indicar que se puede arrastrar hacia abajo.
- Bordes redondeados superiores (`rounded-t-2xl`).
- Padding interno `p-4`, con `pb-[env(safe-area-inset-bottom)]` para safe areas.
- Max-height: `max-h-[85vh]` con scroll interno si el contenido excede.
- En desktop (md:+), renderizar como modal centrado normal.

---

## Routing

Usar `react-router-dom` v6+:

```typescript
// Rutas
<Routes>
  <Route path="/" element={<CancionList />} />
  <Route path="/cancion/nueva" element={<CancionForm />} />
  <Route path="/cancion/:id" element={<CancionDetalle />} />
  <Route path="/cancion/:id/editar" element={<CancionForm />} />
  <Route path="/cancion/:id/presentacion" element={<CancionPresentacion />} />
</Routes>
```

---

## Lógica de Negocio por Hook

### `useCanciones.ts`
- `getCanciones()` — Listar todas, ordenadas por `updated_at` desc.
- `getCancion(id)` — Obtener una con sus secciones y notas (query con joins).
- `createCancion(data)` — Insertar y retornar la nueva canción.
- `updateCancion(id, data)` — Actualizar campos de la canción.
- `deleteCancion(id)` — Eliminar (cascade elimina secciones y notas).
- `buscarCanciones(query)` — Filtrar por título con `ilike`.

### `useSecciones.ts`
- `addSeccion(cancion_id, data)` — Insertar con orden = max(orden) + 1.
- `updateSeccion(id, data)` — Actualizar tipo, letra.
- `deleteSeccion(id)` — Eliminar (cascade elimina notas).
- `reordenarSecciones(cancion_id, secciones)` — Actualizar campo `orden` de múltiples secciones.

### `useNotas.ts`
- `getNotas(seccion_id)` — Listar notas de una sección.
- `addNota(seccion_id, data)` — Insertar nota.
- `updateNota(id, data)` — Actualizar contenido.
- `deleteNota(id)` — Eliminar nota.

---

## Query Supabase para Obtener Canción Completa

```typescript
const { data, error } = await supabase
  .from('canciones')
  .select(`
    *,
    secciones (
      *,
      notas (*)
    )
  `)
  .eq('id', cancionId)
  .order('orden', { referencedTable: 'secciones', ascending: true })
  .order('orden', { referencedTable: 'secciones.notas', ascending: true })
  .single();
```

---

## Variables de Entorno

```env
# .env.local
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

---

## Dependencias del Proyecto

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "@supabase/supabase-js": "^2.45.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

---

## Instrucciones de Ejecución

1. Crear el proyecto con `npm create vite@latest sion-sync -- --template react-ts`
2. Instalar dependencias: `cd sion-sync && npm install`
3. Instalar Tailwind: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
4. Instalar dependencias adicionales: `npm install react-router-dom @supabase/supabase-js lucide-react`
5. Configurar las variables de entorno en `.env.local`
6. Crear las tablas en Supabase ejecutando el SQL proporcionado arriba
7. Crear el archivo `public/manifest.json` para PWA:
   ```json
   {
     "name": "SionSync",
     "short_name": "SionSync",
     "description": "Gestión de canciones de alabanza",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#0f172a",
     "theme_color": "#7c3aed",
     "icons": [
       { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }
   ```
8. Agregar en `index.html`: `<link rel="manifest" href="/manifest.json">` y el meta viewport con `maximum-scale=1.0, user-scalable=no`
9. Desarrollar siguiendo la estructura de archivos y los tipos definidos
10. Para desarrollo local: `npm run dev`
11. Para probar en móvil durante desarrollo: usar `npm run dev -- --host` y acceder desde el celular por IP local
12. Para desplegar: conectar el repo de GitHub a Vercel, configurar las variables de entorno en Vercel

---

## Criterios de Aceptación

### Funcionalidad
- [ ] Se pueden crear, editar y eliminar canciones
- [ ] Se pueden agregar, editar, eliminar y reordenar secciones dentro de una canción
- [ ] Cada tipo de sección tiene un color/badge visual distinto
- [ ] Se pueden agregar, editar y eliminar notas/acordes en cada sección (opcional)
- [ ] Los acordes se muestran diferenciados visualmente de la letra
- [ ] Existe un modo presentación limpio sin controles de edición
- [ ] La búsqueda por título funciona en la lista de canciones
- [ ] Eliminar una canción elimina sus secciones y notas (cascade)

### Mobile-First
- [ ] Toda la app es usable y completa en un celular de 375px de ancho (iPhone SE como referencia mínima)
- [ ] Todos los botones y elementos interactivos tienen un touch target mínimo de 44x44px
- [ ] Los inputs de texto usan font-size 16px o mayor (evitar auto-zoom en iOS)
- [ ] Los formularios usan bottom sheets en móvil, modales en desktop
- [ ] Existe bottom nav en pantalla de inicio
- [ ] El FAB de "nueva canción" no se superpone con la bottom nav ni con contenido
- [ ] El modo presentación funciona bien en portrait y landscape
- [ ] Se respetan safe areas (notch, barra gestual) en la bottom nav y en bottom sheets
- [ ] La app se puede instalar como PWA desde el navegador (manifest.json configurado)
- [ ] No hay scroll horizontal indeseado en ninguna pantalla
- [ ] Swipe-to-delete funciona en tarjetas de canciones
- [ ] No hay errores en consola en flujos normales

### Responsive
- [ ] En desktop (md:+) el layout aprovecha el ancho con grids y modales centrados
- [ ] La transición entre móvil y desktop es fluida, sin elementos rotos
