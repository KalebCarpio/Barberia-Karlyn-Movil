// Inicio de sesion con Google en Android/iOS. Usa un modulo nativo: funciona en la development build
// (EAS), no en Expo Go, por eso se carga solo cuando el usuario toca el boton.

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export class GoogleSignInUnavailableError extends Error {
  constructor() {
    super('El acceso con Google funciona en la app instalada (development build), no en Expo Go.');
    this.name = 'GoogleSignInUnavailableError';
  }
}

export interface GoogleAuthProvider {
  // Devuelve el access token de Google, o null si el usuario cancelo.
  getAccessToken(): Promise<string | null>;
  signOut(): Promise<void>;
}

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let configuredModule: GoogleSignInModule | null = null;

function loadModule(): GoogleSignInModule {
  if (configuredModule) return configuredModule;
  if (!WEB_CLIENT_ID) throw new Error('Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en la configuracion de la app.');
  let module: GoogleSignInModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    module = require('@react-native-google-signin/google-signin');
  } catch {
    throw new GoogleSignInUnavailableError();
  }
  module.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, scopes: ['profile', 'email'] });
  configuredModule = module;
  return module;
}

export const nativeGoogleAuth: GoogleAuthProvider = {
  async getAccessToken() {
    const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = loadModule();
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return null;
      const { accessToken } = await GoogleSignin.getTokens();
      return accessToken;
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return null;
      if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Este dispositivo no tiene Google Play Services actualizado.');
      }
      throw error;
    }
  },

  async signOut() {
    if (!configuredModule) return;
    await configuredModule.GoogleSignin.signOut().catch(() => undefined);
  },
};
