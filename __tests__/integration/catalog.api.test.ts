// Pruebas de integracion de CAT-01 (#53) y CAT-02 (#54) contra la REST API simulada:
// endpoint consultado, respuesta con datos, respuesta vacia y error de API.
import servicios from '../fixtures/servicios-activos.json';
import locales from '../fixtures/locales.json';
import barberos from '../fixtures/barberos-local-1.json';
import { API_URL } from '../../src/api';
import { fetchBarbersByBranch, fetchBranches, fetchServices } from '../../src/catalog';
import { mockFetchNetworkError, mockFetchResponse, requestOf } from './mockFetch';

describe('CAT-01 GET /servicios/activos', () => {
  it('consulta el endpoint de servicios activos y devuelve solo registros validos', async () => {
    const fetchMock = mockFetchResponse(servicios);
    const result = await fetchServices();
    expect(requestOf(fetchMock).url).toBe(`${API_URL}/api/servicios/activos`);
    expect(result.map((service) => service.id)).toEqual([11, 12, 13]);
  });

  it('devuelve lista vacia cuando la API no tiene servicios', async () => {
    mockFetchResponse({ servicios: [] });
    await expect(fetchServices()).resolves.toEqual([]);
  });

  it('propaga el mensaje de error de la API', async () => {
    mockFetchResponse({ message: 'Error interno del servidor' }, 500);
    await expect(fetchServices()).rejects.toThrow('Error interno del servidor');
  });
});

describe('CAT-01 GET /locales', () => {
  it('consulta sucursales sin token y las mapea', async () => {
    const fetchMock = mockFetchResponse(locales);
    const result = await fetchBranches();
    const request = requestOf(fetchMock);
    expect(request.url).toBe(`${API_URL}/api/locales`);
    expect(request.headers.Authorization).toBeUndefined();
    expect(result.map((branch) => branch.name)).toEqual(['Barberia Carlyn', 'Barberia Carlyn Sucursal 2']);
  });

  it('devuelve lista vacia cuando no hay sucursales', async () => {
    mockFetchResponse({ ok: true, data: [] });
    await expect(fetchBranches()).resolves.toEqual([]);
  });

  it('informa un mensaje generico si la API responde error sin cuerpo', async () => {
    mockFetchResponse(undefined, 503);
    await expect(fetchBranches()).rejects.toThrow('No fue posible comunicarse con el servidor.');
  });
});

describe('CAT-02 GET /barbero/local/:id', () => {
  it('consulta los barberos de la sucursal seleccionada', async () => {
    const fetchMock = mockFetchResponse(barberos);
    const result = await fetchBarbersByBranch(1);
    expect(requestOf(fetchMock).url).toBe(`${API_URL}/api/barbero/local/1`);
    expect(result.map((barber) => barber.id)).toEqual([34, 35, 36]);
  });

  it('devuelve lista vacia si la sucursal no tiene barberos', async () => {
    mockFetchResponse({ ok: true, data: [], total: 0 });
    await expect(fetchBarbersByBranch(2)).resolves.toEqual([]);
  });

  it('propaga el error de la API al consultar barberos', async () => {
    mockFetchResponse({ ok: false, mensaje: 'Error al obtener barberos del local' }, 500);
    await expect(fetchBarbersByBranch(1)).rejects.toThrow('No fue posible comunicarse con el servidor.');
  });

  it('propaga la falla de red sin conexion', async () => {
    mockFetchNetworkError();
    await expect(fetchBarbersByBranch(1)).rejects.toThrow('Network request failed');
  });
});
