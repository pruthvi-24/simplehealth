// API_BASE comes from config.js (loaded before this file in index.html)

function getToken() {
  return localStorage.getItem("token");
}

// Wraps fetch: adds the JSON content-type + auth header, and throws
// with the server's error message so callers can just try/catch.
async function apiRequest(path, { method = "GET", body, isFormData = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // no body / not JSON
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

const api = {
  register: (name, email, password) =>
    apiRequest("/auth/register", { method: "POST", body: { name, email, password } }),

  login: (email, password) =>
    apiRequest("/auth/login", { method: "POST", body: { email, password } }),

  me: () => apiRequest("/auth/me"),

  listProfiles: () => apiRequest("/test-profile"),

  createProfile: (name, relation) =>
    apiRequest("/test-profile", { method: "POST", body: { name, relation } }),

  deleteProfile: (id) => apiRequest(`/test-profile/${id}`, { method: "DELETE" }),

  listRecords: (profileId) => apiRequest(`/records/profile/${profileId}`),

  createRecordWithImages: (formData) =>
    apiRequest("/records/create-with-images", {
      method: "POST",
      body: formData,
      isFormData: true
    }),

  deleteRecord: (id) => apiRequest(`/records/${id}`, { method: "DELETE" })
};
