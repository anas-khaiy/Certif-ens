import axios from 'axios';
import { API_APPRENANT } from '../config';

const learnerApi = axios.create({
    baseURL: API_APPRENANT,
    withCredentials: true,
});

learnerApi.interceptors.request.use(
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

learnerApi.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default learnerApi;
