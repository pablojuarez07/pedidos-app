import { environment } from '../../environments/environment';
const API_URL = environment.apiUrl;

async function request(method: string, endpoint: string, data: any = null): Promise<any> {
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" }
  };

  if (data) options.body = JSON.stringify(data);

  const response = await fetch(`${API_URL}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
    error.message ||   // ← aquí está lo importante
    error.error ||
    "Error en la petición";

    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return response.json();
}

async function requestForm(endpoint: string, formData: FormData): Promise<any> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    body: formData,   // ❗ sin headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
    error.message ||   // ← aquí está lo importante
    error.error ||
    "Error en la petición";

    throw new Error(
      Array.isArray(message) ? message.join(", ") : message
    );
  }

  return response.json();
}

const api = {
  get: (endpoint: string) => request("GET", endpoint),
  post: (endpoint: string, data: any) => request("POST", endpoint, data),
  postForm: (endpoint: string, formData: FormData) => requestForm(endpoint, formData),
  put: (endpoint: string, data: any) => request("PUT", endpoint, data),
  delete: (endpoint: string) => request("DELETE", endpoint)
};

export default api;