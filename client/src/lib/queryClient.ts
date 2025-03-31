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

  if (urlOrData === undefined) {
    // apiRequest('/api/books')
    method = 'GET';
    url = methodOrUrl;
    bodyData = undefined;
  } else if (typeof urlOrData === 'string') {
    // apiRequest('GET', '/api/books')
    method = methodOrUrl;
    url = urlOrData;
    bodyData = undefined;
  } else {
    // apiRequest('POST', '/api/books', { title: 'Book' })
    method = methodOrUrl;
    url = urlOrData as string;
    bodyData = data;
  }

  const res = await fetch(url, {
    method,
    headers: bodyData ? { "Content-Type": "application/json" } : {},
    body: bodyData ? JSON.stringify(bodyData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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
