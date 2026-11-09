
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authRequest = async (endpoint, payload = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Something went wrong");
  }

  return result.data;
};

export const signUp = async (payload) => {
  return authRequest("/api/v1/auth/signup", payload);
};

export const logIn = async (payload) => {
  return authRequest("/api/v1/auth/login", payload);
};

export const refreshAccessToken = async () => {
  return authRequest("/api/v1/auth/refresh");
};

export const logOut = async () => {
  return authRequest("/api/v1/auth/logout");
};
