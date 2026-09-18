import axios from "axios";

// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://vraj-creation.onrender.com/api");

// =====================================================
// AXIOS INSTANCE
// =====================================================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // =================================================
    // FORMDATA
    // =================================================

    if (config.data instanceof FormData) {
      // Browser/Axios khud multipart boundary set karega
      delete config.headers["Content-Type"];
    } else {
      // Normal JSON request
      config.headers = config.headers || {};
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    console.error(
      "API ERROR:",
      error.response?.status,
      error.response?.data || error.message
    );

    return Promise.reject(error);
  }
);

export default api;