import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import API from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';

// Validation schema
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage({ setUser }) {
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('user'); // 'user' or 'admin'
  const navigate = useNavigate();

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' }
  });

  const onSubmit = async (data) => {
    setError('');
    try {
      const res = await API.post('/login', data);
      
      // Validate role matches selected login type
      if (loginType === 'admin' && res.data.user.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        return;
      }
      if (loginType === 'user' && res.data.user.role === 'admin') {
        setError('Please use Admin Login for admin accounts.');
        return;
      }
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Login failed!");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Left Panel - Branding */}
        <div className={`login-brand ${loginType === 'admin' ? 'admin' : ''}`}>
          <div className="brand-content">
            <div className="brand-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <path d="M9 22V12h6v10"/>
              </svg>
            </div>
            <h1>Store Manager</h1>
            <p>Connect with local shopkeepers. Share inventory. Grow together.</p>
            
            <div className="brand-features">
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Real-time inventory tracking</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Network with nearby stores</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Smart stock alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="login-form-section">
          {/* Role Toggle */}
          <div className="role-tabs">
            <button 
              type="button"
              className={`role-tab ${loginType === 'user' ? 'active' : ''}`}
              onClick={() => { setLoginType('user'); setError(''); }}
            >
              User
            </button>
            <button 
              type="button"
              className={`role-tab ${loginType === 'admin' ? 'active' : ''}`}
              onClick={() => { setLoginType('admin'); setError(''); }}
            >
              Admin
            </button>
          </div>

          <div className="form-header">
            <h2>Sign in</h2>
            <p>{loginType === 'admin' ? 'Access the admin dashboard' : 'Welcome back to your account'}</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                {...register('username')}
                className={errors.username ? 'error' : ''}
              />
              {errors.username && <span className="input-error-text">{errors.username.message}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  {...register('password')}
                  className={errors.password ? 'error' : ''}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="input-error-text">{errors.password.message}</span>}
            </div>

            <div className="form-row">
              <label className="checkbox-wrap">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="link">Forgot password?</Link>
            </div>

            <button 
              type="submit" 
              className={`btn-submit ${loginType === 'admin' ? 'admin' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="form-footer">
              Don't have an account? <Link to="/register" className="link">Create one</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}