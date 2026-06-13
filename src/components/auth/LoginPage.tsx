import { useState } from 'react';
import { Music2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PoliticaDatos } from './PoliticaDatos';

type ErrorInfo = {
  message: string;
  action?: { label: string; onClick: () => void };
};

function parseAuthError(error: Error, isRegister: boolean, switchToLogin: () => void): ErrorInfo {
  const msg = error.message;

  if (msg === 'EMAIL_EXISTS') {
    return {
      message: 'Este correo ya tiene una cuenta registrada.',
      action: { label: 'Iniciar sesión', onClick: switchToLogin },
    };
  }

  if (msg === 'Invalid login credentials') {
    return {
      message: 'Correo o contraseña incorrectos. Si te registraste con Google, usa el botón de Google.',
    };
  }

  if (msg === 'Email not confirmed') {
    return { message: 'Debes confirmar tu correo electrónico. Revisa tu bandeja de entrada.' };
  }

  if (msg === 'User already registered') {
    return {
      message: 'Este correo ya está registrado.',
      action: { label: 'Iniciar sesión', onClick: switchToLogin },
    };
  }

  if (msg.includes('Password should be at least')) {
    return { message: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  if (isRegister) {
    return { message: msg || 'No se pudo crear la cuenta. Intenta de nuevo.' };
  }

  return { message: msg || 'No se pudo iniciar sesión. Intenta de nuevo.' };
}

export function LoginPage() {
  const { signInWithEmail, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPolitica, setShowPolitica] = useState(false);

  const switchToLogin = () => { setIsRegister(false); setErrorInfo(null); setSuccessMsg(null); };
  const switchToRegister = () => { setIsRegister(true); setErrorInfo(null); setSuccessMsg(null); };

  if (showPolitica) {
    return <PoliticaDatos onBack={() => setShowPolitica(false)} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    setSuccessMsg(null);

    setLoading(true);
    try {
      if (isRegister) {
        await signUp(email, password);
        setSuccessMsg('Cuenta creada. Revisa tu correo para confirmar.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      setErrorInfo(parseAuthError(error, isRegister, switchToLogin));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh bg-app flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <Music2 className="w-8 h-8 text-brand-700" />
          <h1 className="text-3xl font-bold text-brand-900">SionSync</h1>
        </div>

        <div className="bg-white rounded-2xl border border-brand-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 text-center">
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </h2>

          {errorInfo && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-xl mb-4">
              <p>{errorInfo.message}</p>
              {errorInfo.action && (
                <button
                  onClick={errorInfo.action.onClick}
                  className="mt-1 text-brand-700 font-medium hover:underline"
                >
                  {errorInfo.action.label}
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-xl mb-4">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-400 text-sm"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-400 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-700 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Entrar'}
            </button>

            {isRegister && (
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Al registrarte, aceptas nuestra{' '}
                <button
                  type="button"
                  onClick={() => setShowPolitica(true)}
                  className="text-brand-700 font-medium hover:underline"
                >
                  Política de Tratamiento de Datos Personales
                </button>
                .
              </p>
            )}
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">o continúa con</span>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-slate-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <p className="text-center text-sm text-slate-400 mt-5">
            {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button
              onClick={() => isRegister ? switchToLogin() : switchToRegister()}
              className="text-brand-700 font-medium hover:underline"
            >
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
