import React, { useState } from 'react';
import { redirect, useNavigate, useRoutes } from 'react-router-dom';
import { Mail, Lock, Loader, School } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (loginError) {
      setLoginError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      console.log('Sending login request with:', { username: formData.username });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      console.log('Raw response:', response);
      const data = await response.json();
      console.log('Login response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      if (!data.token || !data.user) {
        throw new Error('Invalid response format from server');
      }

      // Store token
      localStorage.setItem('token', data.token);
      console.log('Token stored:', localStorage.getItem('token'));

      // Store user data
      const userData = {
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
        email: data.user.email
      };
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('User data stored:', localStorage.getItem('user'));

      // Determine redirect path
      const roleRoutes = {
        admin: '/admin/dashboard',
        teacher: '/teacher/dashboard',
        student: '/student/dashboard',
        parent: '/parent/dashboard',
        staff: '/staff/dashboard',
        investor: '/investor/dashboard'
      };

      const redirectPath = roleRoutes[data.user.role] || '/dashboard';
      navigate(redirectPath)
      
      // Add a small delay to ensure storage is complete
      setTimeout(() => {
        navigate(redirectPath);
      }, 100);
      
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <School className="logo-icon" />
        </div>
        <h2 className="login-title">
          School Management System
        </h2>
        <p className="login-subtitle">
          Sign in to access your account
        </p>
      </div>

      <div className="login-form-container">
        <div className="login-form-box">
          <form className="login-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="form-group">
                <div className="form-icon-container">
                  <Mail className="form-icon" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className={`form-input ${errors.username ? 'form-input-error' : ''}`}
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              {errors.username && (
                <p className="error-message">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="form-group">
                <div className="form-icon-container">
                  <Lock className="form-icon" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              {errors.password && (
                <p className="error-message">{errors.password}</p>
              )}
            </div>

            {loginError && (
              <div className="error-alert">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="error-alert-text">
                      {loginError}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="submit-button"
              >
                {isLoading ? (
                  <>
                    <Loader className="loader-icon" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;