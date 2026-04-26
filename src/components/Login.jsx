import React, { useState } from 'react';
import { signInWithGoogle } from '../auth';

function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-brand animate-in">
        <div className="login-card small">
        <p className="small-text">
          ANALOG PRINTMAKING
        </p>
        </div>
        <h1>Brickpress</h1>
        <div className="divider" style={{ width: '40px', background: 'var(--ink-red)', opacity: 0.4 }}></div>
        <p>
          Build with bricks. Print like a press.
        </p>
      </div>

      <div className="login-card animate-in animate-in-delay-1">
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>
          Sign in to save and manage your designs
        </p>

        <button
          className="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{ fontSize: '15px', padding: '12px 28px', width: '100%' }}
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {error && (
          <p className="save-msg error">{error}</p>
        )}
      </div>
    </div>
  );
}

export default Login;
