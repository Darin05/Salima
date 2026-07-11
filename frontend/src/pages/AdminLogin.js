import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';
import { Lock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminLogin() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/login`, credentials);
      localStorage.setItem('admin_token', response.data.token);
      toast.success('Login successful');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blush mx-auto mb-4 flex items-center justify-center">
            <Lock className="w-8 h-8 text-rose-deep" />
          </div>
          <h1 className="text-3xl font-playfair text-plum mb-2">{t('adminLogin')}</h1>
          <p className="text-plum-soft">Serenne Beauty Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder={t('email')}
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            className="input-field"
            data-testid="admin-email-input"
            required
          />
          <input
            type="password"
            placeholder={t('password')}
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            className="input-field"
            data-testid="admin-password-input"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            data-testid="admin-login-btn"
          >
            {loading ? 'Logging in...' : t('login')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
