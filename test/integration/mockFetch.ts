// Simula la REST API: cada prueba define la respuesta y luego revisa la solicitud que envio la app.
export function mockFetchResponse(body: unknown, status = 200) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    // Igual que fetch real: un cuerpo vacio hace fallar json().
    json: async () => {
      if (body === undefined) throw new SyntaxError('Unexpected end of JSON input');
      return body;
    },
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

export function mockFetchNetworkError(message = 'Network request failed') {
  const fetchMock = jest.fn().mockRejectedValue(new TypeError(message));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

export function requestOf(fetchMock: jest.Mock, call = 0) {
  const [url, init] = fetchMock.mock.calls[call] as [string, RequestInit];
  return { url, headers: (init.headers || {}) as Record<string, string> };
}
