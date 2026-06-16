# Permisos y roles de SionSync

Este documento describe qué puede hacer cada tipo de usuario (rol) en cada parte
de la aplicación. Está pensado para entenderse sin conocimientos técnicos.

> Última actualización: 2026-06-15.

---

## Los cuatro roles

| Rol | Para qué sirve |
| --- | --- |
| **Miembro nuevo** | Es el rol que se asigna **automáticamente** al registrarse. No tiene acceso a ningún módulo: queda a la espera de que un administrador lo promueva. |
| **Miembro de alabanza** | Forma parte del equipo musical: **crea y gestiona sus propias canciones** y arma sesiones. |
| **Gestor de alabanza** | Coordina al equipo: además de las canciones, **administra las programaciones** (aseo, sonido, etc.) y asigna responsables. |
| **Administrador** | **Acceso total**: todo lo anterior, sin la limitación de "solo lo mío", más la gestión de usuarios, roles y tipos de programación. |

Cuando alguien se registra entra como **Miembro nuevo** y solo ve un aviso de
"cuenta pendiente de activación". Un **Administrador** debe cambiarle el rol para
que pueda usar la app.

---

## Las dos capas de seguridad

Los permisos se aplican en **dos niveles**, para que sean confiables:

1. **La interfaz (lo que ves):** la app oculta o desactiva los botones de las
   acciones que tu rol no permite.
2. **La base de datos (la barrera real):** aunque alguien intente saltarse la
   interfaz, la base de datos (reglas RLS de Supabase) **bloquea** de verdad
   cualquier acción no permitida.

A lo largo del documento, **"sus" / "las suyas"** significa *los elementos que esa
persona creó* (su dueño).

Leyenda de las tablas: ✅ permitido · ❌ no permitido · ⚠️ permitido con límite.

---

## 1. Acceso general y navegación

| Acción | Miembro nuevo | Miembro de alabanza | Gestor de alabanza | Administrador |
| --- | :---: | :---: | :---: | :---: |
| Iniciar sesión | ✅ | ✅ | ✅ | ✅ |
| Ver el inicio | ⚠️ solo el aviso de cuenta pendiente | ✅ | ✅ | ✅ |
| Entrar a **Canciones** y **Sesiones** | ❌ | ✅ | ✅ | ✅ |
| Entrar a **Programación** | ❌ | ⚠️ solo consulta | ✅ | ✅ |
| Entrar a **Administración** | ❌ | ❌ | ❌ | ✅ |

> El Miembro nuevo, si intenta abrir cualquier pantalla por dirección directa, es
> devuelto al inicio automáticamente.

---

## 2. Catálogo de canciones

| Acción | Miembro nuevo | Miembro de alabanza | Gestor de alabanza | Administrador |
| --- | :---: | :---: | :---: | :---: |
| Ver el catálogo y abrir una canción | ❌ | ✅ | ✅ | ✅ |
| Modo presentación de una canción | ❌ | ✅ | ✅ | ✅ |
| Crear una canción | ❌ | ✅ | ✅ | ✅ |
| Editar la canción (datos, secciones, letra y acordes) | ❌ | ⚠️ solo las suyas | ✅ todas | ✅ todas |
| Eliminar una canción | ❌ | ⚠️ solo las suyas | ✅ todas | ✅ todas |

> Agregar, editar o borrar **secciones y acordes** sigue la misma regla que editar
> la canción: el dueño, un gestor o un administrador.

---

## 3. Sesiones

Una sesión es un grupo ordenado de canciones del catálogo para tocar un día.

| Acción | Miembro nuevo | Miembro de alabanza | Gestor de alabanza | Administrador |
| --- | :---: | :---: | :---: | :---: |
| Ver las sesiones y abrir una | ❌ | ✅ | ✅ | ✅ |
| Modo presentación de la sesión (pasar de canción) | ❌ | ✅ | ✅ | ✅ |
| Crear una sesión | ❌ | ✅ | ✅ | ✅ |
| Agregar / quitar / ordenar canciones | ❌ | ⚠️ solo en las suyas | ✅ todas | ✅ todas |
| Editar (nombre/fecha) o eliminar la sesión | ❌ | ⚠️ solo las suyas | ✅ todas | ✅ todas |
| Crear una canción nueva desde la sesión | ❌ | ✅ | ✅ | ✅ |

> Crear una canción desde la sesión la guarda también en el catálogo (las mismas
> reglas de creación de canciones aplican).

---

## 4. Programación (aseo, sonido, etc.)

| Acción | Miembro nuevo | Miembro de alabanza | Gestor de alabanza | Administrador |
| --- | :---: | :---: | :---: | :---: |
| Ver la pantalla de programación | ❌ | ⚠️ solo los días con responsables asignados | ✅ todo (incluidas inactivas) | ✅ todo |
| Ver los responsables asignados | ❌ | ✅ | ✅ | ✅ |
| Crear una programación | ❌ | ❌ | ✅ | ✅ |
| Editar / activar / desactivar / eliminar una programación | ❌ | ❌ | ⚠️ las que creó | ✅ todas |
| Asignar o quitar responsables | ❌ | ❌ | ⚠️ en sus programaciones | ✅ en todas |
| Duplicar una semana completa | ❌ | ❌ | ✅ | ✅ |
| Marcar a un responsable como **"notificado"** | ❌ | ❌ | ❌ (solo lo ve) | ✅ |
| Ver el estado "notificado / pendiente" | ❌ | ✅ | ✅ | ✅ |

> **Nota sobre el Gestor:** la base de datos permitiría a cualquier gestor editar
> cualquier programación; para evitar que dos gestores se pisen, la interfaz le
> muestra los controles de edición **solo en las programaciones que él creó**. El
> Administrador puede editar las de todos.
>
> **Marcar "notificado"** (confirmar que ya se le avisó a la persona) es una acción
> **exclusiva del Administrador**; el resto solo ve el estado.

---

## 5. Tipos de programación

Son las categorías de las programaciones (Aseo, Sonido, etc.), con su color.

| Acción | Miembro nuevo | Miembro de alabanza | Gestor de alabanza | Administrador |
| --- | :---: | :---: | :---: | :---: |
| Crear / editar / eliminar tipos | ❌ | ❌ | ❌ | ✅ |

> El Gestor **usa** los tipos al crear programaciones, pero solo el Administrador
> los **administra**.

---

## 6. Administración de usuarios

| Acción | Miembro nuevo | Miembro de alabanza | Gestor de alabanza | Administrador |
| --- | :---: | :---: | :---: | :---: |
| Ver la lista de usuarios | ❌ | ❌ | ❌ | ✅ |
| Cambiar el rol de un usuario (promover/cambiar) | ❌ | ❌ | ❌ | ✅ |
| Activar o desactivar un usuario | ❌ | ❌ | ❌ | ✅ |

---

## 7. Perfil y notificaciones personales

Estas acciones son sobre la **propia** cuenta y están disponibles para cualquiera
que haya iniciado sesión (incluido el Miembro nuevo, desde el inicio).

| Acción | Miembro nuevo | Miembro de alabanza | Gestor de alabanza | Administrador |
| --- | :---: | :---: | :---: | :---: |
| Editar mi propio nombre | ✅ | ✅ | ✅ | ✅ |
| Activar / desactivar notificaciones en mis dispositivos | ✅ | ✅ | ✅ | ✅ |
| Recibir recordatorios (si soy responsable y las activé) | ✅ | ✅ | ✅ | ✅ |

> Cada quien solo administra **sus propios** dispositivos y **su propio** nombre;
> nadie puede tocar el perfil ni los dispositivos de otra persona (salvo que un
> Administrador cambie roles o active/desactive cuentas).

---

## Resumen rápido

- **Miembro nuevo:** prácticamente nada hasta que lo promuevan; solo su perfil.
- **Miembro de alabanza:** canciones y sesiones (las suyas para editar, todas para
  ver); la programación solo de consulta.
- **Gestor de alabanza:** todo lo de canciones/sesiones + crear y gestionar
  programaciones y asignar responsables (las que él creó).
- **Administrador:** todo, sin límites, más usuarios, roles, tipos de programación
  y la confirmación de "notificado".
