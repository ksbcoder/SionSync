# SionSync

Aplicación web **mobile-first** para que un equipo de alabanza gestione su
repertorio de canciones y organice quién es responsable de cada servicio.
Está pensada para usarse sobre todo desde el celular y se puede **instalar como
app** (PWA) desde el navegador.

## ¿Qué permite hacer?

- **Canciones**: crear, editar y buscar canciones, cada una dividida en
  secciones tipificadas (verso, coro, puente, etc.) con su letra y sus
  acordes/notas. Incluye un **modo presentación** limpio para usar mientras se
  toca.
- **Programación**: organizar por semana quién es responsable de cada tipo de
  servicio y marcar a quién ya se le avisó.
- **Roles y permisos**: distintos niveles de acceso (administrador, gestor de
  alabanza, miembro de alabanza, miembro de iglesia), aplicados tanto en la
  interfaz como en la base de datos.
- **Tiempo real**: si alguien cambia algo desde otro dispositivo, la pantalla se
  actualiza sola.

## Stack técnico

- **Frontend**: React 19 + TypeScript, construido con Vite.
- **Estilos**: Tailwind CSS.
- **Backend / base de datos**: Supabase (PostgreSQL + API automática + Auth +
  Realtime). La seguridad real se aplica con *Row Level Security* (reglas por
  fila en la propia base de datos).
- **Despliegue**: Vercel.
- **Gestor de paquetes**: [Bun](https://bun.sh).

## Arquitectura

El código en `src/` está separado por capas, cada una con una responsabilidad
clara:

| Carpeta            | Responsabilidad                                                        |
|--------------------|------------------------------------------------------------------------|
| `domain/`          | Tipos y reglas del negocio (qué es una canción, una sección, un rol).  |
| `infrastructure/`  | Repositorios: el **único** lugar que habla con Supabase.               |
| `hooks/`           | Lógica reutilizable de pantalla (cargar datos, permisos, tiempo real). |
| `components/`      | La interfaz visual, organizada por funcionalidad.                      |

Las reglas de seguridad de la base de datos viven en `supabase/migrations/`,
como migraciones incrementales numeradas.

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   bun install
   ```

2. Crear un archivo `.env.local` en la raíz con las claves del proyecto de
   Supabase:

   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=tu-clave-publica
   ```

3. Aplicar las migraciones de `supabase/migrations/` en tu proyecto de Supabase
   (en orden numérico).

## Scripts

| Comando                | Qué hace                                              |
|------------------------|-------------------------------------------------------|
| `bun run dev`          | Levanta el servidor de desarrollo.                    |
| `bun run build`        | Verifica tipos y genera la versión de producción.     |
| `bun run preview`      | Sirve localmente la versión ya construida.            |
| `bun run lint`         | Revisa el código con ESLint.                          |
| `bun run test`         | Ejecuta las pruebas una vez.                          |
| `bun run test:watch`   | Ejecuta las pruebas y se queda observando cambios.    |
| `bun run test:coverage`| Ejecuta las pruebas y mide la cobertura.              |

## Pruebas

Las pruebas usan [Vitest](https://vitest.dev) y se centran en la lógica pura del
dominio (cálculos de fechas y ordenamiento de secciones), que es la parte más
delicada y fácil de romper sin darse cuenta. Los archivos de prueba viven junto
al código que prueban, con el sufijo `.test.ts`.
