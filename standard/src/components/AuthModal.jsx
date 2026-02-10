import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password. If you are new, please Sign Up first.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email already exists. Please Login instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{ width: '400px', background: 'var(--bg-card)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border-light)', position: 'relative', overflow: 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="glass-shine" style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}></div>
            
            <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
               <X size={24} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
               <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                  {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join the Vibe' : 'Reset Password'}
               </h2>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {mode === 'login' ? 'Login to continue your musical journey' : mode === 'register' ? 'Create an account to save your favorites' : 'Enter your email to reset password'}
               </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(255, 75, 75, 0.1)', color: '#FF4B4B', padding: '10px', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <AlertCircle size={16} />
                 {error}
              </div>
            )}

            {mode === 'forgot' && resetSent ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                 <div style={{ width: '60px', height: '60px', background: 'var(--color-green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Check size={30} color="white" />
                 </div>
                 <p>Password reset link sent to <b>{email}</b></p>
                 <button onClick={() => setMode('login')} className="btn-tactile btn-blue" style={{ marginTop: '1rem', width: '100%' }}>Back to Login</button>
              </div>
            ) : (
              <form onSubmit={mode === 'forgot' ? handleForgotPassword : handleEmailAuth}>
                 <div style={{ marginBottom: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                       <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                       <input 
                         type="email" 
                         placeholder="Email Address" 
                         required
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className="auth-input"
                         style={{ width: '100%', height: '50px', borderRadius: '14px', border: '2px solid var(--border-light)', padding: '0 1rem 0 3rem', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}
                       />
                    </div>
                 </div>

                 {mode !== 'forgot' && (
                   <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ position: 'relative' }}>
                         <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                         <input 
                           type="password" 
                           placeholder="Password" 
                           required={mode !== 'forgot'}
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className="auth-input"
                           style={{ width: '100%', height: '50px', borderRadius: '14px', border: '2px solid var(--border-light)', padding: '0 1rem 0 3rem', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}
                         />
                      </div>
                      {mode === 'login' && (
                        <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                           <span onClick={() => setMode('forgot')} style={{ fontSize: '0.8rem', color: 'var(--color-blue)', cursor: 'pointer', fontWeight: 600 }}>Forgot Password?</span>
                        </div>
                      )}
                   </div>
                 )}

                 <button 
                   type="submit" 
                   disabled={loading}
                   className="btn-tactile btn-blue hover-lift"
                   style={{ width: '100%', height: '50px', borderRadius: '14px', fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                 >
                    {loading ? 'Processing...' : mode === 'login' ? 'Login' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
                    {!loading && <ArrowRight size={18} />}
                 </button>

                 {mode !== 'forgot' && (
                   <>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
                     </div>

                     <button 
                       type="button"
                       onClick={handleGoogleSignIn}
                       className="btn-tactile hover-lift"
                       style={{ width: '100%', height: '50px', borderRadius: '14px', border: '2px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                     >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt="Google" />
                        Continue with Google
                     </button>
                   </>
                 )}
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
               {mode === 'login' ? (
                 <p>Don't have an account? <span onClick={() => setMode('register')} style={{ color: 'var(--color-green)', fontWeight: 800, cursor: 'pointer' }}>Sign Up</span></p>
               ) : mode === 'register' ? (
                 <p>Already have an account? <span onClick={() => setMode('login')} style={{ color: 'var(--color-blue)', fontWeight: 800, cursor: 'pointer' }}>Login</span></p>
               ) : (
                 <p>Remembered? <span onClick={() => setMode('login')} style={{ color: 'var(--color-blue)', fontWeight: 800, cursor: 'pointer' }}>Back to Login</span></p>
               )}
            </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
