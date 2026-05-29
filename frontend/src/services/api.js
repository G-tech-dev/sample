import axios from "axios";

export const API_BASE_URL = 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true   // ✅ important for session cookies
});

// ======================== AUTH ========================
export const signin = async (userName, password) => {
    try {
        const response = await api.post('/login', { userName, password });
        // Store user info in localStorage for UI convenience
        localStorage.setItem('user_id', response.data.user.id);
        localStorage.setItem('userName', response.data.user.userName);
        localStorage.setItem('role', response.data.user.role);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Login failed' };
    }
};

export const signup = async (userName, password, role = 'viewer') => {
    try {
        const response = await api.post('/register', { userName, password, role });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Registration failed' };
    }
};

export const logout = async () => {
    try {
        await api.post('/logout');
    } catch (error) {
        console.error('Logout error', error);
    } finally {
        localStorage.removeItem('user_id');
        localStorage.removeItem('userName');
        localStorage.removeItem('role');
    }
};

// Check if user is logged in by verifying session with backend
export const isLoggedIn = async () => {
    try {
        const response = await api.get('/me');
        // update localStorage with fresh data
        localStorage.setItem('user_id', response.data.userId);
        localStorage.setItem('userName', response.data.userName);
        localStorage.setItem('role', response.data.role);
        return true;
    } catch {
        return false;
    }
};

export const getCurrentUser = () => {
    return {
        user_id: localStorage.getItem('user_id'),
        userName: localStorage.getItem('userName'),
        role: localStorage.getItem('role')
    };
};

export const requireAuth = async (navigate) => {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
        navigate('/login');
        return null;
    }
    return getCurrentUser();
};

export const handleLogout = async (navigate) => {
    await logout();
    navigate('/login');
};

// ======================== TRADES ========================
export const fetchTrades = async () => {
    try {
        const response = await api.get('/trades');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch trades' };
    }
};

export const addTrade = async (tradeData) => {
    try {
        const response = await api.post('/trades', tradeData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add trade' };
    }
};

export const updateTrade = async (id, tradeData) => {
    try {
        const response = await api.put(`/trades/${id}`, tradeData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update trade' };
    }
};

export const deleteTrade = async (id) => {
    try {
        const response = await api.delete(`/trades/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to delete trade' };
    }
};

// ======================== MODULES ========================
export const fetchModules = async () => {
    try {
        const response = await api.get('/modules');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch modules' };
    }
};

export const addModule = async (moduleData) => {
    try {
        const response = await api.post('/modules', moduleData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add module' };
    }
};

export const updateModule = async (id, moduleData) => {
    try {
        const response = await api.put(`/modules/${id}`, moduleData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update module' };
    }
};

export const deleteModule = async (id) => {
    try {
        const response = await api.delete(`/modules/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to delete module' };
    }
};

// ======================== TRAINEES ========================
export const fetchTrainees = async () => {
    try {
        const response = await api.get('/trainees');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch trainees' };
    }
};

export const fetchTraineeById = async (id) => {
    try {
        const response = await api.get(`/trainees/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch trainee' };
    }
};

export const addTrainee = async (traineeData) => {
    try {
        const response = await api.post('/trainees', traineeData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add trainee' };
    }
};

export const updateTrainee = async (id, traineeData) => {
    try {
        const response = await api.put(`/trainees/${id}`, traineeData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update trainee' };
    }
};

export const deleteTrainee = async (id) => {
    try {
        const response = await api.delete(`/trainees/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to delete trainee' };
    }
};

// ======================== ENROLLMENTS ========================
export const addEnrollment = async (traineeId, enrollmentData) => {
    try {
        const response = await api.post(`/trainees/${traineeId}/enrollments`, enrollmentData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add enrollment' };
    }
};

export const updateEnrollment = async (traineeId, moduleId, updateData) => {
    try {
        const response = await api.put(`/trainees/${traineeId}/enrollments/${moduleId}`, updateData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update enrollment' };
    }
};

export const deleteEnrollment = async (traineeId, moduleId) => {
    try {
        const response = await api.delete(`/trainees/${traineeId}/enrollments/${moduleId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to delete enrollment' };
    }
};