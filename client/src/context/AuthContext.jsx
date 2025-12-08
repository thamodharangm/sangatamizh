import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { ref, get, child } from 'firebase/database';
import { auth, googleProvider, db } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Gamification State (Persisted in LocalStorage for demo)
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('sangtamizh_stats');
    return saved ? JSON.parse(saved) : { gems: 1240, streak: 12 };
  });

  useEffect(() => {
    localStorage.setItem('sangtamizh_stats', JSON.stringify(stats));
  }, [stats]);

  const updateStats = (type) => {
    setStats(prev => {
      if (type === 'song_played') {
        return { ...prev, gems: prev.gems + 10, streak: prev.streak + 0 }; // Add 10 gems per song
      }
      if (type === 'streak') {
        return { ...prev, streak: prev.streak + 1 };
      }
      return prev;
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch user role and other data from Realtime Database
        try {
          const dbRef = ref(db);
          const snapshot = await get(child(dbRef, `users/${currentUser.uid}`));
          if (snapshot.exists()) {
            const userData = snapshot.val();
            // Merge auth user and db user data
            setUser({ ...currentUser, ...userData });
          } else {
             // If no data in DB, just use auth user (and maybe role: 'user')
             setUser({ ...currentUser, role: 'user' });
          }
        } catch (error) {
          console.error("Error fetching user data", error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const googleSignIn = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, googleSignIn, resetPassword, loading, stats, updateStats }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
