import axios from "axios";;

export const API_BASE_URL = 'http://localhost:5000/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const signin = async (username, password) => {
    try {
        const response = await api.post('/users/login', { username, password });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Login failed' };
    }
};
export const signup = async (username,password)=>{
    try{
        const response = await api.post('/users/register',{username,password});
        return response.data;
    }
    catch(err){
        throw error.response?.data || {error: 'Register failed'};
    }

}

export const fetchSpareParts = async () => {
    try {
        const response = await api.get('/spareparts');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch spare parts' };
    }
};  

export const addSparePart = async (sparePartData) => {
    try {
        const response = await api.post('/spareparts', sparePartData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add spare part' };
    }
};
export const updateSparePart = async (id, sparePartData) => {
    try {
        const response = await api.put(`/spareparts/${id}`, sparePartData); 
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update spare part' };
    }
};
export const deleteSparePart = async (id) => {
    try {
        const response = await api.delete(`/spareparts/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to delete spare part' };
    }
};

export const fetchStockIn = async () => {
    try {
        const response = await api.get('/stockin');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch stock in' };
    }
};
export const addStockIn = async (stockInData) => {
    try {
        const response = await api.post('/stockin', stockInData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add stock in' };
    }
};

export const fetchStockOut = async () => {
    try {
        const response = await api.get('/stockout');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch stock out' };
    }
};
export const addStockOut = async (stockOutData) => {
    try {
        const response = await api.post('/stockout', stockOutData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add stock out' };
    }
};

export const logout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
};
export const isLoggedIn = () => {
    return !!localStorage.getItem('user_id');
};
export const getCurrentUser = () => {
    return {
        user_id: localStorage.getItem('user_id'),
        username: localStorage.getItem('username')
    };
}
export const requireAuth = (navigate) => {
    if (!isLoggedIn()) {
        navigate('/login');
    } else {   
             return getCurrentUser();
    }};

export const handleLogout = (navigate) => {
    logout();
    navigate('/login');
}