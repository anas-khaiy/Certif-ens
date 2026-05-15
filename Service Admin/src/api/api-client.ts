import axios from 'axios';
import { API_ADMIN } from '../config';

const api = axios.create({
    baseURL: API_ADMIN,
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
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('user');
            localStorage.removeItem('adminNom');
            localStorage.removeItem('adminPrenom');
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);


export default api;
