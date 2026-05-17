import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, LogIn, UserPlus } from 'lucide-react';
import api from '../api/axios';

const Login = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await api.post('auth/register/', { 
          username, 
          password, 
          email,
          first_name: name
        });
        setError('Registration success! Please login now.');
        setIsRegister(false);
        setUsername('');
        setPassword('');
        setName('');
        setEmail('');
      } else {
        await login(username, password);
        navigate('/');
      }
    } catch (err) {
      setError(isRegister ? 'Registration failed. Check your details.' : 'Authentication failed. Check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <div className="premium-card login-card glassmorphism">
        <div className="login-header">
          <Truck size={48} color="var(--accent-color)" />
          <h1>SmartDrive</h1>
          <p>{isRegister ? 'Create your account' : 'Welcome back to your dashboard'}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="john@example.com"
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              placeholder="Enter your username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>
          
          {error && <div className={`error-message ${error.includes('success') ? 'success' : ''}`}>{error}</div>}
          
          <button type="submit" className="btn-primary w-full">
            {isRegister ? <><UserPlus size={20} /> Register</> : <><LogIn size={20} /> Login</>}
          </button>
        </form>
        
        <div className="login-footer">
          <span>{isRegister ? 'Already have an account?' : 'Don\'t have an account?'}</span>
          <button onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}>
            {isRegister ? 'Login' : 'Register now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
