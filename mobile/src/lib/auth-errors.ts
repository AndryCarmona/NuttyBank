import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

/** Traduce los errores de Supabase Auth a mensajes claros en español. */
export function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos.';
    case 'email_not_confirmed':
      return 'Debes confirmar tu correo antes de iniciar sesión.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Ya existe una cuenta con ese correo.';
    case 'weak_password':
      return 'La contraseña es demasiado débil. Usa al menos 8 caracteres.';
    case 'email_address_invalid':
      return 'El correo no es válido.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
    case 'signup_disabled':
      return 'El registro de nuevas cuentas está deshabilitado.';
  }

  if (isAuthRetryableFetchError(error)) {
    return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  }

  return 'No se pudo completar la operación. Inténtalo de nuevo.';
}
