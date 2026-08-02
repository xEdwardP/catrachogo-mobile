import { AxiosError } from 'axios';

function extractBackendMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((m) => typeof m === 'string')) {
      return message.join(' ');
    }
  }
  return null;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.';
    }

    const status = error.response.status;
    const backendMessage = extractBackendMessage(error.response.data);

    switch (status) {
      case 400:
        return backendMessage ?? 'Los datos enviados no son válidos.';
      case 401:
        return backendMessage ?? 'Correo o contraseña incorrectos.';
      case 402:
        return 'No tienes saldo suficiente para completar esta acción.';
      case 403:
        return backendMessage ?? 'No tienes permiso para realizar esta acción.';
      case 409:
        return backendMessage ?? 'Ya existe un registro con estos datos.';
      case 429:
        return 'Demasiados intentos en poco tiempo. Espera un momento antes de volver a intentar.';
      default:
        return backendMessage ?? 'Ocurrió un error inesperado. Intenta de nuevo.';
    }
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

export function translatePasswordUpdateError(error: unknown): string {
  if (!(error instanceof AxiosError) || !error.response) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.';
  }

  const status = error.response.status;
  const rawMessage = (extractBackendMessage(error.response.data) ?? '').toLowerCase();

  if (rawMessage.includes('google')) {
    return 'Esta cuenta inició sesión con Google y no tiene una contraseña que cambiar.';
  }
  if (status === 401) {
    return 'La contraseña actual no es correcta.';
  }
  if (status === 400) {
    return 'La nueva contraseña debe tener al menos 8 caracteres.';
  }
  return 'No se pudo cambiar la contraseña. Intenta de nuevo.';
}
