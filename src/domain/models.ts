// Modelos de dominio: lo que usa la app, independiente de como los nombre la REST API.

export type Service = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  imageUrl?: string;
};

export type Branch = { id: number; name: string; detail: string };

export type Barber = { id: number; name: string; specialty: string };

export type Slot = { time: string; available: boolean; reason?: string };

export type BookingDate = { key: string; label: string; available: boolean };

export type Appointment = {
  id: number;
  service: Service;
  date: string;
  time: string;
  barber: string;
  barberId?: number;
  branchId?: number;
  status: string;
  canManage: boolean;
};

export type UserProfile = { name: string; email: string; phone: string };

export type NewAppointment = {
  barberId: number;
  serviceId: number;
  branchId: number;
  date: string;
  time: string;
};
