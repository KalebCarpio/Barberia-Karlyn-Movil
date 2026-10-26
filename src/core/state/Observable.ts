export type Listener<T> = (state: T) => void;

// Patron Observer: guarda un estado y avisa a cada suscriptor cuando cambia.
// Los ViewModels se suscriben con useSyncExternalStore para volver a renderizar.
export class Observable<T> {
  private state: T;
  private readonly listeners = new Set<Listener<T>>();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState = () => this.state;

  subscribe = (listener: Listener<T>) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  protected setState(next: T) {
    this.state = next;
    this.listeners.forEach((listener) => listener(next));
  }
}
