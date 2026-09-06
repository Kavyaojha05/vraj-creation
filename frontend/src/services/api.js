import axios from "axios";

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://vraj-creation.onrender.com/api";

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

    /*
     * IMPORTANT:
     * FormData ke liye Content-Type manually set mat karo.
     *
     * Browser/Axios automatically:
     * multipart/form-data; boundary=...
     * set karega.
     */

    if (config.data instanceof FormData) {
      // Agar kahin default Content-Type laga hua ho
      // to usko remove kar do.
      delete config.headers["Content-Type"];
    } else {
      // Normal JSON requests
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