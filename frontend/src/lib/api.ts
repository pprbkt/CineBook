import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';

    // Skip refresh for auth endpoints to avoid loops
    const skipRefresh = url.includes('/auth/me') || url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !skipRefresh) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch {
        // Don't redirect — let the component handle auth state
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Events
export const eventsAPI = {
  getAll: (params?: any) => api.get('/events', { params }),
  getOne: (id: string) => api.get(`/events/${id}`),
  getFeatured: () => api.get('/events/featured'),
  getRecommendations: () => api.get('/events/recommendations'),
  getSimilar: (id: string) => api.get(`/events/${id}/similar`),
  getCategories: () => api.get('/events/categories'),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
};

// Showtimes
export const showtimesAPI = {
  getByEvent: (eventId: string, params?: any) => api.get(`/showtimes/event/${eventId}`, { params }),
  getOne: (id: string) => api.get(`/showtimes/${id}`),
  getSeatRecommendations: (id: string) => api.get(`/showtimes/${id}/seat-recommendations`),
  create: (data: any) => api.post('/showtimes', data),
  update: (id: string, data: any) => api.put(`/showtimes/${id}`, data),
  delete: (id: string) => api.delete(`/showtimes/${id}`),
};

// Bookings
export const bookingsAPI = {
  create: (data: any) => api.post('/bookings', data),
  confirm: (id: string, data?: any) => api.post(`/bookings/${id}/confirm`, data || {}),
  getMyBookings: () => api.get('/bookings/my'),
  getOne: (id: string) => api.get(`/bookings/${id}`),
  cancel: (id: string) => api.post(`/bookings/${id}/cancel`),
  downloadTicket: (id: string) => api.get(`/bookings/${id}/ticket`, { responseType: 'blob' }),
  getAll: (params?: any) => api.get('/bookings', { params }),
};

// Reviews
export const reviewsAPI = {
  create: (data: any) => api.post('/reviews', data),
  getByEvent: (eventId: string, params?: any) => api.get(`/reviews/event/${eventId}`, { params }),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Venues
export const venuesAPI = {
  getAll: (params?: any) => api.get('/venues', { params }),
  getOne: (id: string) => api.get(`/venues/${id}`),
};
