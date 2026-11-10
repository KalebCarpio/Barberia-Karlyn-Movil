// Pantallas disponibles con sesion iniciada; el login y la carga dependen del estado de la sesion.
export type AppScreen = 'home' | 'services' | 'booking' | 'appointments' | 'profile' | 'privacy';

// Pantallas sin sesion iniciada.
export type AuthScreen = 'login' | 'register' | 'recovery';
