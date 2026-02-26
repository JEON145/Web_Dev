import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import API from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';

// Validation schema
const registerSchema = z.object({
  shopName: z.string().min(2, 'Shop name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'admin']),
  securityQuestion: z.string().min(5, 'Please provide a security question'),
  securityAnswer: z.string().min(2, 'Please provide an answer'),
});

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { shopName: '', username: '', email: '', password: '', role: 'user', securityQuestion: '', securityAnswer: '' }
  });

  const onSubmit = async (data) => {
    setError('');
    try {
      const res = await API.post('/register', data);
      
      if (res.status === 201) {
        alert("Account created successfully!");
        navigate('/login');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Registration failed. Try again.";
      setError(errorMessage);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Left Panel - Branding */}
        <div className="login-brand register">
          <div className="brand-content">
            <div className="brand-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <h1>Join the Network</h1>
            <p>Connect with nearby shopkeepers and help each other when stocks run low.</p>
            
            <div className="brand-features">
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Free to join</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Connect with local stores</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Manage your inventory</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="login-form-section">
          <div className="form-header">
            <h2>Create account</h2>
            <p>Get started with Store Manager</p>
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
            <div className="form-row-2col">
              <div className="input-group">
                <label htmlFor="shopName">Shop Name</label>
                <input 
                  id="shopName"
                  type="text" 
                  placeholder="Your shop name" 
                  {...register('shopName')}
                  className={errors.shopName ? 'error' : ''}
                />
                {errors.shopName && <span className="input-error-text">{errors.shopName.message}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="username">Username</label>
                <input 
                  id="username"
                  type="text" 
                  placeholder="Choose a username" 
                  {...register('username')}
                  className={errors.username ? 'error' : ''}
                />
                {errors.username && <span className="input-error-text">{errors.username.message}</span>}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input 
                id="email"
                type="email" 
                placeholder="Your email address" 
                {...register('email')}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="input-error-text">{errors.email.message}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password" 
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

            <div className="input-group">
              <label htmlFor="securityQuestion">Security Question</label>
              <input
                id="securityQuestion"
                type="text"
                placeholder="e.g. What is your mother's maiden name?"
                {...register('securityQuestion')}
                className={errors.securityQuestion ? 'error' : ''}
              />
              {errors.securityQuestion && <span className="input-error-text">{errors.securityQuestion.message}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="securityAnswer">Security Answer</label>
              <input
                id="securityAnswer"
                type="text"
                placeholder="Answer to security question"
                {...register('securityAnswer')}
                className={errors.securityAnswer ? 'error' : ''}
              />
              {errors.securityAnswer && <span className="input-error-text">{errors.securityAnswer.message}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="role">Account Type</label>
              <select 
                id="role"
                className="form-select"
                {...register('role')}
              >
                <option value="user">Staff Member</option>
                <option value="admin">Shop Owner (Admin)</option>
              </select>
            </div>

            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>

            <p className="form-footer">
              Already have an account? <Link to="/login" className="link">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}