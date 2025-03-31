import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// GET request overload
export function apiRequest(url: string): Promise<Response>;

// Method + URL overload 
export function apiRequest(method: string, url: string): Promise<Response>;

// Method + URL + Data overload
export function apiRequest(method: string, url: string, data: unknown): Promise<Response>;

// Implementation
export async function apiRequest(
  methodOrUrl: string,
  urlOrData?: string | unknown,
  data?: unknown
): Promise<Response> {
  let method: string;
  let url: string;
  let bodyData: unknown | undefined;

  // Détection de la signature d'appel utilisée
  if (urlOrData === undefined) {
    // Cas 1: apiRequest('/api/books') - un seul argument = GET
    method = 'GET';
    url = methodOrUrl;
    bodyData = undefined;
  } else if (typeof urlOrData === 'string') {
    // Cas 2: apiRequest('POST', '/api/books', data) ou apiRequest('GET', '/api/books')
    // Le premier argument est une méthode HTTP, le second l'URL
    method = methodOrUrl;
    url = urlOrData;
    bodyData = data; // Peut être undefined
  } else {
    // Cas 3: apiRequest('/api/books', data) - le premier est l'URL, le second est le body
    method = 'POST'; // Par défaut si la méthode n'est pas spécifiée = POST
    url = methodOrUrl;
    bodyData = urlOrData;
  }

  // Validation des paramètres
  if (!url || typeof url !== 'string') {
    console.error('[apiRequest] URL invalide:', url);
    throw new Error("URL invalide pour la requête API");
  }

  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    console.warn(`[apiRequest] Méthode HTTP inhabituelle: ${method}, on la remplace par POST`);
    method = 'POST';
  }

  // Log de la requête
  console.log(`[apiRequest] ${method} ${url}`, bodyData !== undefined ? `avec données: ${JSON.stringify(bodyData)}` : "sans données");

  try {
    // Exécution de la requête
    const res = await fetch(url, {
      method,
      headers: bodyData !== undefined ? { "Content-Type": "application/json" } : {},
      body: bodyData !== undefined ? JSON.stringify(bodyData) : undefined,
      credentials: "include",
    });

    // Log de la réponse en cas d'erreur
    if (!res.ok) {
      let errorText;
      try {
        errorText = await res.text();
      } catch (e) {
        errorText = res.statusText;
      }
      console.error(`[apiRequest] Erreur ${res.status} pour ${method} ${url}:`, errorText);
    } else {
      console.log(`[apiRequest] Succès ${res.status} pour ${method} ${url}`);
    }

    // On lance la gestion d'erreurs
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`[apiRequest] Exception lors de la requête ${method} ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
