import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Update order status
export const updateOrderStatus = async (orderId, status) => {
    try {
        const response = await axios.put(`${API_URL}/orders/${orderId}/status`, { status });
        return response.data;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

// Handle successful payment
export const handleSuccessfulPayment = async (orderId, paymentMethod) => {
    try {
        const response = await axios.post(`${API_URL}/orders/${orderId}/payment/success`, { paymentMethod });
        return response.data;
    } catch (error) {
        console.error('Error processing payment:', error);
        throw error;
    }
}; 