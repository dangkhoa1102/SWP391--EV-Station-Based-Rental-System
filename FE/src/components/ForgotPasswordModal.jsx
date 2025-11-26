import React, { useState } from 'react';
import authApi from '../services/authApi';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordModal() {
    const { showForgotPassword, setShowForgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!showForgotPassword) return null; // NOTE TẠM, LÁT CÁI NÀY KHÔNG ỔN THÌ PHẢI XÓA !!!

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage('');

        try {
            // Gọi hàm API từ service
            const response = await authApi.forgotPassword(email);

            if (response.data.isSuccess) {
                setMessage(response.data.message || 'Request is sent successfully. Please check your email.');
            } else {
                setError(response.data.message || 'An error occurred. Please try again.');
            }

        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }

    };

    return (
        <div className='modal-overlay' style={{display: 'flex'}}>
            <div className='modal-content'>
                <span className='close-btn' onClick={() => setShowForgotPassword(false)}>&times;</span><br />
                <form onSubmit={handleSubmit}>
            <h3>Type your email</h3>
            
            {message && <p style={{ color: 'green' }}>✅ {message}</p>}
            {error && <p style={{ color: 'red' }}>❌ {error}</p>}
            
            <input 
                type="email" 
                placeholder="Your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
            />
            
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Request'}
            </button>
        </form>
            </div>
        </div>
    );
        
}