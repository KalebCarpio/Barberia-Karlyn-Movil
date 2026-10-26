// Caja blanca, patron Observer: la sesion notifica a sus suscriptores en cada cambio.
import { Observable } from '../../../src/core/state/Observable';
import { SessionStore } from '../../../src/core/state/sessionStore';

const user = { name: 'Admin', email: 'admin@carlyn.mx', phone: '7711234567' };

describe('SessionStore', () => {
  it('inicia verificando la sesion guardada', () => {
    expect(new SessionStore().getState()).toEqual({ status: 'checking', token: null, user: null });
  });

  it('notifica a cada suscriptor al iniciar, actualizar y cerrar sesion', () => {
    const store = new SessionStore();
    const first = jest.fn();
    const second = jest.fn();
    store.subscribe(first);
    store.subscribe(second);

    store.signIn('token', user);
    store.updateUser({ ...user, name: 'Admin Carlyn' });
    store.signOut();

    expect(first).toHaveBeenCalledTimes(3);
    expect(second).toHaveBeenNthCalledWith(1, { status: 'signedIn', token: 'token', user });
    expect(second).toHaveBeenNthCalledWith(2, { status: 'signedIn', token: 'token', user: { ...user, name: 'Admin Carlyn' } });
    expect(second).toHaveBeenNthCalledWith(3, { status: 'signedOut', token: null, user: null });
  });

  it('deja de notificar despues de cancelar la suscripcion', () => {
    const store = new SessionStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.signIn('token', user);
    expect(listener).not.toHaveBeenCalled();
  });

  it('es un Observable reutilizable', () => {
    expect(new SessionStore()).toBeInstanceOf(Observable);
  });
});
