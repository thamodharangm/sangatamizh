import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { doc, setDoc } from "firebase/firestore";
import { firestore } from '../config/firebase';

// Mobile-optimized Login Page - Full Parity with Desktop
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const { login, register, googleSignIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const clearErrors = () => {
    setError('');
    setMessage('');
  };

  const saveUserToDB = async (user) => {
    try {
      if (!user) return;
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        lastLogin: new Date().toISOString()
      }, { merge: true });

      await api.post('/analytics/login', {
          userId: user.uid,
          email: user.email
      });

    } catch (e) {
      console.error("Error saving user to DB:", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    if (showForgot) {
      try {
        await resetPassword(email);
        setMessage('Password reset email sent! Check your inbox.');
        setLoading(false);
      } catch (err) {
        setError(err.message.replace('Firebase: ', ''));
        setLoading(false);
      }
      return;
    }

    try {
      if (isLogin) {
        const userCredential = await login(email, password);
        await saveUserToDB(userCredential.user);
        navigate('/');
      } else {
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }
        const userCredential = await register(email, password);
        await saveUserToDB(userCredential.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearErrors();
    try {
      const userCredential = await googleSignIn();
      await saveUserToDB(userCredential.user);
      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowForgot(false);
    clearErrors();
  };

  return (
    <div className="login-page" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        padding: '1rem' 
    }}>
      <div className="card-flat" style={{ width: '100%', maxWidth: '400px', padding: '2rem 1.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem', color: 'white' }}>
          {showForgot ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
        </h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {showForgot ? 'Enter your email' : (isLogin ? 'Login to continue listening' : 'Start your musical journey')}
        </p>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        {message && <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.5)', color: '#86efac', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center' }}>{message}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-flat"
            required
            disabled={loading}
          />
          
          {!showForgot && (
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-flat"
              required
              disabled={loading}
            />
          )}

          {!isLogin && !showForgot && (
            <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-flat"
                required
                disabled={loading}
            />
          )}

          {isLogin && !showForgot && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => { setShowForgot(true); clearErrors(); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button 
            type="submit"
            className="btn-3d btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }} 
            disabled={loading}
          >
            {loading ? 'Processing...' : (showForgot ? 'Send Reset Link' : (isLogin ? 'LOG IN' : 'SIGN UP'))}
          </button>
        </form>

        {!showForgot && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            <button 
                className="btn-3d btn-white" 
                onClick={handleGoogleSignIn} 
                style={{ 
                    width: '100%', 
                    gap: '12px', 
                    display: 'flex',
                }}
                disabled={loading}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
              Continue with Google
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          {showForgot ? (
             <button 
             onClick={() => { setShowForgot(false); setIsLogin(true); clearErrors(); }}
             style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
           >
             Back to Login
           </button>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={toggleMode}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
