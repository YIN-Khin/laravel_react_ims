// import axios from 'axios'
// import { toast } from 'react-hot-toast'
// import { config } from './config'

// // Use environment variable with fallback to config
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || config.base_api_url;

// // Create axios instance
// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   },
//   withCredentials: false,
//   timeout: 60000, // 60 second timeout (increased for analytics/reports)
// })

// // Request interceptor to add auth token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token')
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }
    
//     // Add CSRF token if available (for Laravel)
//     const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
//     if (csrfToken) {
//       config.headers['X-CSRF-TOKEN'] = csrfToken
//     }
    
//     return config
//   },
//   (error) => {
//     return Promise.reject(error)
//   }
// )

// // Response interceptor to handle errors
// api.interceptors.response.use(
//   (response) => {
//     return response
//   },
//   (error) => {
//     // Handle network errors
//     if (!error.response) {
//       toast.error('Network error. Please check your connection.')
//     }
//     // Don't show toast for auth-related errors in interceptor
//     // Let the calling component handle them
//     else if (error.response?.status === 401 && !error.config.url?.includes('/auth/')) {
//       localStorage.removeItem('token')
//       localStorage.removeItem('user')
//       window.location.href = '/login'
//       toast.error('Your session has expired. Please login again.')
//     } else if (error.response?.status === 403) {
//       toast.error('You do not have permission to perform this action')
//     } else if (error.response?.status >= 500) {
//       toast.error('Server error. Please try again later.')
//     }
    
//     return Promise.reject(error)
//   }
// )

// export default api


import axios from "axios";
import { toast } from "react-hot-toast";
import { config as appConfig } from "./config";

// Base URL from config (config.js already uses env with fallback)
const baseURL = (appConfig.base_api_url || "").replace(/\/+$/, ""); // remove trailing /

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 60000,
  withCredentials: false, // keep false for Bearer-token API
});

// Request interceptor: attach Bearer token (if exists)
api.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token");
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    // Optional: CSRF header (only useful if you later switch to Sanctum cookie auth)
    const csrf = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");
    if (csrf) {
      req.headers["X-CSRF-TOKEN"] = csrf;
    }

    return req;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If server didn't respond (network/CORS/timeout)
    if (!error.response) {
      const msg =
        error.code === "ECONNABORTED"
          ? "Request timeout. Please try again."
          : "Network error. Please check your connection.";
      toast.error(msg);
      return Promise.reject(error);
    }

    const { status } = error.response;
    const url = error.config?.url || "";

    // 401: token invalid/expired (avoid redirect for auth endpoints)
    if (status === 401 && !url.includes("/auth/") && !url.includes("/login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.error("Your session has expired. Please login again.");
      window.location.assign("/login");
      return Promise.reject(error);
    }

    if (status === 403) {
      toast.error("You do not have permission to perform this action.");
    } else if (status === 404) {
      // optional: comment out if too noisy
      // toast.error("Resource not found.");
    } else if (status >= 500) {
      toast.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  }
);

export default api;
