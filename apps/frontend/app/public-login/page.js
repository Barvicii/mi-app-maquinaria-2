'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PublicLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const router = useRouter();

  const testConnection = async () => {
    try {
      setStatus('Testing connection...');
      const response = await fetch('/api/public/test-no-auth');
      const data = await response.json();
      console.log('Connection test:', data);
      setStatus(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Connection test failed:', error);
      setStatus('Connection test failed: ' + error.message);
    }
  };

  const createAdmin = async () => {
    try {
      setStatus('Creating admin user...');
      const response = await fetch('/api/public/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Admin creation:', data);
      setStatus(JSON.stringify(data, null, 2));
      
      if (data.success) {
        setEmail('orchardservices96@gmail.com');
        setPassword('BaltonInalen321!');
      }
    } catch (error) {
      console.error('Admin creation failed:', error);
      setStatus('Admin creation failed: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          color: '#333'
        }}>
          Sistema de Maquinaria
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={testConnection}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Test Connection
          </button>
          
          <button 
            onClick={createAdmin}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Admin User
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px',
              color: '#333'
            }}>
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px',
              color: '#333'
            }}>
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          {error && (
            <div style={{ 
              color: 'red', 
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#ffe6e6',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {status && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            maxHeight: '200px',
            overflow: 'auto',
            border: '1px solid #ddd'
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
