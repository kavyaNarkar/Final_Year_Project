import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptors for Auth Token
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('challan_user'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
        config.headers['X-User-Id'] = user.id;
    }
    return config;
});

export default api;
