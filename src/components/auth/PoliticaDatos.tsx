import { ArrowLeft } from 'lucide-react';

interface PoliticaDatosProps {
  onBack: () => void;
}

export function PoliticaDatos({ onBack }: PoliticaDatosProps) {
  return (
    <div className="min-h-svh bg-app">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-10">
        <button onClick={onBack} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Política de Tratamiento de Datos</h1>
      </header>

      <main className="px-5 py-6 max-w-2xl mx-auto text-sm text-gray-700 leading-relaxed flex flex-col gap-5">
        <p className="text-xs text-gray-400">Última actualización: 23 de mayo de 2026</p>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">1. Responsable del tratamiento</h2>
          <p>
            SionSync es una aplicación desarrollada para la gestión de canciones de alabanza en comunidades
            de fe. El responsable del tratamiento de los datos personales recopilados a través de esta
            aplicación es el administrador de la instancia de SionSync.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">2. Datos que recopilamos</h2>
          <p>Al utilizar SionSync, recopilamos los siguientes datos personales:</p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li><strong>Datos de registro:</strong> nombre, dirección de correo electrónico.</li>
            <li><strong>Datos de autenticación:</strong> información proporcionada por el proveedor de identidad (Google) si se utiliza inicio de sesión social.</li>
            <li><strong>Datos de uso:</strong> canciones creadas, secciones, notas y actividad dentro de la aplicación.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">3. Finalidad del tratamiento</h2>
          <p>Los datos personales se utilizan exclusivamente para:</p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li>Crear y gestionar su cuenta de usuario.</li>
            <li>Permitir la creación, edición y visualización de contenido dentro de la aplicación.</li>
            <li>Identificar al autor de cada canción y gestionar permisos de acceso.</li>
            <li>Mejorar la experiencia de uso de la aplicación.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">4. Almacenamiento y seguridad</h2>
          <p>
            Sus datos se almacenan en servidores de Supabase, que implementa cifrado en tránsito (TLS)
            y en reposo. El acceso a los datos está protegido mediante políticas de seguridad a nivel
            de fila (RLS), lo que garantiza que cada usuario solo pueda acceder a la información que
            le corresponde según su rol.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">5. Derechos del titular</h2>
          <p>
            De conformidad con la Ley 1581 de 2012 de Colombia y sus normas complementarias,
            usted tiene derecho a:
          </p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li><strong>Conocer:</strong> acceder a sus datos personales almacenados.</li>
            <li><strong>Actualizar:</strong> corregir datos inexactos, incompletos o desactualizados.</li>
            <li><strong>Rectificar:</strong> solicitar la corrección de información errónea.</li>
            <li><strong>Suprimir:</strong> solicitar la eliminación de sus datos cuando no exista obligación legal de conservarlos.</li>
            <li><strong>Revocar:</strong> retirar su consentimiento para el tratamiento de datos en cualquier momento.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">6. Compartición de datos</h2>
          <p>
            SionSync no vende, alquila ni comparte sus datos personales con terceros con fines
            comerciales. Los datos solo se comparten con los proveedores de infraestructura necesarios
            para el funcionamiento de la aplicación (Supabase, Google Auth).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">7. Retención de datos</h2>
          <p>
            Sus datos personales se conservarán mientras mantenga una cuenta activa en la aplicación.
            Si solicita la eliminación de su cuenta, sus datos serán eliminados de forma permanente,
            salvo aquellos que deban conservarse por obligación legal.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">8. Contacto</h2>
          <p>
            Para ejercer sus derechos o realizar consultas sobre el tratamiento de sus datos
            personales, puede comunicarse a través del correo electrónico del administrador
            de la aplicación.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-2">9. Modificaciones</h2>
          <p>
            Esta política puede ser actualizada periódicamente. Los cambios serán notificados
            a través de la aplicación. El uso continuado de SionSync después de la publicación
            de cambios constituye la aceptación de los mismos.
          </p>
        </section>
      </main>
    </div>
  );
}
