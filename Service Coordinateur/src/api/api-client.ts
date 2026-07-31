import axios from 'axios';
import { API_COORDINATEUR } from '../config';

const api = axios.create({
    baseURL: API_COORDINATEUR,
    withCredentials: true, // Crucial for sending cookies
});

// Request interceptor for adding JWT token (optional if cookies are used)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('isCoordinateur');
            localStorage.removeItem('user');
            localStorage.removeItem('coordinateurNom');
            localStorage.removeItem('coordinateurPrenom');
            localStorage.removeItem('token');
            if (window.location.pathname !== '/coordinateur/login') {
                window.location.href = '/coordinateur/login';
            }
        }
        return Promise.reject(error);
    }
);


export default api;
