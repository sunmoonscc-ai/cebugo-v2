import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../firebase/config';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const isAdmin = user.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;
        const userDocRef = doc(db, 'users', user.uid);

        let userSnap;
        try {
          userSnap = await getDoc(userDocRef);
        } catch (e) {
          console.error('Failed to fetch user doc from Firestore:', e);
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date(Date.now() - 86400000);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        const dbData = userSnap && userSnap.exists() ? userSnap.data() : null;

        let currentPoints = dbData?.points ?? 450;
        let lastCheckInDate = dbData?.lastCheckInDate || '';
        let consecutiveDays = dbData?.consecutiveDays || 0;
        let pointLedger = dbData?.pointLedger || [];

        // Auto Attendance Check with Consecutive Streak Bonus
        if (lastCheckInDate !== todayStr) {
          if (lastCheckInDate === yesterdayStr) {
            consecutiveDays = (consecutiveDays || 0) + 1;
          } else {
            consecutiveDays = 1;
          }

          // Streak Bonus: 20 base + (consecutiveDays - 1)
          const earnedPoints = 20 + (consecutiveDays - 1);
          currentPoints += earnedPoints;
          lastCheckInDate = todayStr;

          const checkInItem = {
            id: `checkin_${Date.now()}`,
            title: consecutiveDays > 1 ? `일일 출석 체크 (${consecutiveDays}일 연속 출석!)` : '일일 출석 체크',
            points: earnedPoints,
            date: todayStr,
            type: 'plus'
          };

          pointLedger = [checkInItem, ...pointLedger.filter(item => item.id !== 'init_checkin')];
        }

        const currentLevel = calculateLevelFromPoints(currentPoints);

        const profileObj = {
          uid: user.uid,
          displayName: user.displayName || '세부 여행자',
          email: user.email || '',
          photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
          points: currentPoints,
          level: currentLevel,
          isAdmin,
          lastCheckInDate,
          consecutiveDays,
          pointLedger,
          phoneVerified: dbData?.phoneVerified ?? true,
          phoneNumber: dbData?.phoneNumber || '09171234567',
          phoneCarrier: dbData?.phoneCarrier || 'Globe',
          kakaoVerified: dbData?.kakaoVerified ?? true,
          kakaoId: dbData?.kakaoId || 'k_cebutraveler',
          favorites: dbData?.favorites || ['place_1', 'place_3']
        };

        setUserProfile(profileObj);

        // Persist to Firestore
        try {
          await setDoc(userDocRef, profileObj, { merge: true });
        } catch (e) {
          console.error('Failed to save user profile to Firestore:', e);
        }
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
