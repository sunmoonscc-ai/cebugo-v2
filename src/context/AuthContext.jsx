import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { calculateLevelFromPoints } from '../utils/imageHelper';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Designated Admin email allowlist
const ADMIN_EMAILS = [
  'sunmoon.scc@gmail.com',
  'hdcc6th@gmail.com'
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const isAdmin = user.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;
        
        setUserProfile((prev) => {
          const currentPoints = prev?.points ?? 450;
          const currentLevel = calculateLevelFromPoints(currentPoints);
          return {
            uid: user.uid,
            displayName: user.displayName || '세부 여행자',
            email: user.email || '',
            photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
            points: currentPoints,
            level: currentLevel,
            isAdmin,
            phoneVerified: prev?.phoneVerified ?? true,
            phoneNumber: prev?.phoneNumber || '09171234567',
            phoneCarrier: prev?.phoneCarrier || 'Globe',
            kakaoVerified: prev?.kakaoVerified ?? true,
            kakaoId: prev?.kakaoId || 'k_cebutraveler',
            favorites: prev?.favorites || ['place_1', 'place_3']
          };
        });
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Google 로그인 실패:", error);
      alert(`Google 로그인에 실패했습니다: ${error.message}`);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  // User manual request for verification
  const requestManualVerification = (type, value) => {
    if (type === 'phone') {
      setUserProfile((prev) => ({
        ...prev,
        phoneNumber: value,
        phoneVerified: true
      }));
    } else if (type === 'kakao') {
      setUserProfile((prev) => ({
        ...prev,
        kakaoId: value,
        kakaoVerified: true
      }));
    }
  };

  // Admin manual approval/revocation of verification status
  const toggleUserVerificationByAdmin = (type) => {
    if (type === 'phone') {
      setUserProfile((prev) => ({ ...prev, phoneVerified: !prev?.phoneVerified }));
    } else if (type === 'kakao') {
      setUserProfile((prev) => ({ ...prev, kakaoVerified: !prev?.kakaoVerified }));
    }
  };

  const toggleFavorite = (placeId) => {
    setUserProfile((prev) => {
      if (!prev) return null;
      const exists = prev.favorites.includes(placeId);
      const updated = exists
        ? prev.favorites.filter((id) => id !== placeId)
        : [...prev.favorites, placeId];
      return { ...prev, favorites: updated };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        loginWithGoogle,
        logout,
        requestManualVerification,
        toggleUserVerificationByAdmin,
        toggleFavorite
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
