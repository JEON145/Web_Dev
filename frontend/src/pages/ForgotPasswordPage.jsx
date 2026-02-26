import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import API from '../api/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Login.css';

// Validation schemas
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const securityResetSchema = z.object({
  securityAnswer: z.string().min(1, 'Provide your security answer'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const navigate = useNavigate();

  // Form for step 1
  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' }
  });

  // Form for step 2 (security answer + new password)
  const resetForm = useForm({
    resolver: zodResolver(securityResetSchema),
    defaultValues: { securityAnswer: '', newPassword: '', confirmPassword: '' }
  });

  // Step 1: Request security question for email
  const handleRequestReset = async (data) => {
    setError('');
    setSuccess('');

    try {
      const res = await API.get('/security-question', { params: { email: data.email } });
      setEmail(data.email);
      setSecurityQuestion(res.data.securityQuestion);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not find account for that email.');
    }
  };

  // Step 2: Verify security answer and reset password
  const handleResetPassword = async (data) => {
    setError('');
    setSuccess('');

    try {
      const res = await API.post('/reset-password-security', { 
        email, 
        securityAnswer: data.securityAnswer, 
        newPassword: data.newPassword 
      });
      setSuccess(res.data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Incorrect answer.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Left Panel - Branding */}
        <div className="login-brand">
          <div className="brand-content">
            <div className="brand-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h1>Password Recovery</h1>
            <p>Don't worry, we'll help you get back into your account securely.</p>
            
            <div className="brand-features">
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Secure verification</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Security question verification</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span>Quick recovery process</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="login-form-section">
          {/* Step indicator */}
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span className="step-num">1</span>
              <span className="step-label">Email</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span className="step-num">2</span>
              <span className="step-label">Reset</span>
            </div>
          </div>

          {step === 1 ? (
            <>
              <div className="form-header">
                <h2>Forgot password?</h2>
                <p>Enter your registered email to answer your security question</p>
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

              {success && (
                <div className="alert alert-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={emailForm.handleSubmit(handleRequestReset)}>
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your registered email"
                    {...emailForm.register('email')}
                    className={emailForm.formState.errors.email ? 'error' : ''}
                  />
                  {emailForm.formState.errors.email && (
                    <span className="input-error-text">{emailForm.formState.errors.email.message}</span>
                  )}
                </div>

                <button type="submit" className="btn-submit" disabled={emailForm.formState.isSubmitting}>
                  {emailForm.formState.isSubmitting ? 'Looking up...' : 'Continue'}
                </button>

                <p className="form-footer">
                  Remember your password? <Link to="/login" className="link">Back to Login</Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <div className="form-header">
                <h2>Reset password</h2>
                <p>Enter the code sent to {email}</p>
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

              {success && (
                <div className="alert alert-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={resetForm.handleSubmit(handleResetPassword)}>
                <div className="input-group">
                  <label htmlFor="resetCode">Reset Code</label>
                  <input
                    id="resetCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    {...resetForm.register('resetCode')}
                    maxLength={6}
                    className={resetForm.formState.errors.resetCode ? 'error' : ''}
                  />
                  {resetForm.formState.errors.resetCode && (
                    <span className="input-error-text">{resetForm.formState.errors.resetCode.message}</span>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="password-wrapper">
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      {...resetForm.register('newPassword')}
                      className={resetForm.formState.errors.newPassword ? 'error' : ''}
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
                  {resetForm.formState.errors.newPassword && (
                    <span className="input-error-text">{resetForm.formState.errors.newPassword.message}</span>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="password-wrapper">
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      {...resetForm.register('confirmPassword')}
                      className={resetForm.formState.errors.confirmPassword ? 'error' : ''}
                    />
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <span className="input-error-text">{resetForm.formState.errors.confirmPassword.message}</span>
                  )}
                </div>

                <button type="submit" className="btn-submit" disabled={resetForm.formState.isSubmitting}>
                  {resetForm.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>

                <button 
                  type="button" 
                  className="btn-back"
                  onClick={() => setStep(1)}
                >
                  ← Change email address
                </button>

                <p className="form-footer">
                  <Link to="/login" className="link">Back to Login</Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
