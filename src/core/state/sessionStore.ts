import { UserProfile } from '../../domain/models';
import { Observable } from './Observable';

export type SessionStatus = 'checking' | 'signedOut' | 'signedIn';

export type SessionState = {
  status: SessionStatus;
  token: string | null;
  user: UserProfile | null;
};

// Sujeto observado de la sesion: el ApiClient lee el token y los ViewModels reaccionan al iniciar o cerrar sesion.
export class SessionStore extends Observable<SessionState> {
  constructor() {
    super({ status: 'checking', token: null, user: null });
  }

  signIn(token: string, user: UserProfile) {
    this.setState({ status: 'signedIn', token, user });
  }

  updateUser(user: UserProfile) {
    this.setState({ ...this.getState(), user });
  }

  signOut() {
    this.setState({ status: 'signedOut', token: null, user: null });
  }
}

export const sessionStore = new SessionStore();
