
import { refreshAccessToken } from "../features/auth/services/authService.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

let refreshPromise = null;

const refreshToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken()
      .then((data) => {
        localStorage.setItem("accessToken", data.token);
        return data.token;
      })
      .catch((error) => {
        localStorage.removeItem("accessToken");
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const apiRequest = async (endpoint, options = {}) => {
  const makeRequest = async (token) => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });
  };

  let token = localStorage.getItem("accessToken");
  let response = await makeRequest(token);

  if (response.status === 401) {
    try {
      token = await refreshToken();
      response = await makeRequest(token);
    } catch {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
  }

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "API request failed");
  }

  return result.data;
};
