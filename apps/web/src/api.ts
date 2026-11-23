export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "same-origin",
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    throw new Error(
      problem.message ?? problem.error ?? `Request failed (${response.status})`,
    );
  }
  return response.json() as Promise<T>;
}
