import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../firebase/config';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
    let unsubUserDoc = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const isAdmin = user.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;
        const userDocRef = doc(db, 'users', user.uid);

        unsubUserDoc = onSnapshot(userDocRef, async (userSnap) => {
          const todayStr = new Date().toISOString().split('T')[0];
          const yesterdayDate = new Date(Date.now() - 86400000);
          const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

          const dbData = userSnap && userSnap.exists() ? userSnap.data() : null;

          let currentPoints = dbData?.points ?? 100;
          let lastCheckInDate = dbData?.lastCheckInDate || '';
          let consecutiveDays = dbData?.consecutiveDays || 0;
          let pointLedger = dbData?.pointLedger || [];
          let needsUpdate = false;

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
            needsUpdate = true;
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
            phoneVerified: dbData?.phoneVerified ?? false,
            phoneNumber: dbData?.phoneNumber || '',
            phoneCarrier: dbData?.phoneCarrier || '',
            kakaoVerified: dbData?.kakaoVerified ?? false,
            kakaoId: dbData?.kakaoId || '',
            favorites: dbData?.favorites || []
          };

          setUserProfile(profileObj);
          setLoading(false);

          // Persist to Firestore if attendance updated or first time
          if (needsUpdate || !dbData) {
            try {
              await setDoc(userDocRef, profileObj, { merge: true });
            } catch (e) {
              console.error('Failed to save user profile to Firestore:', e);
            }
          }
        }, (err) => {
          console.error('Failed to fetch user doc from Firestore:', err);
          setLoading(false);
        });

      } else {
        setCurrentUser(null);
        setUserProfile(null);
        if (unsubUserDoc) unsubUserDoc();
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
    };
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

  const updateUserProfile = async (data) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await setDoc(userDocRef, data, { merge: true });
      setUserProfile(prev => ({ ...prev, ...data }));
    } catch (e) {
      console.error('Failed to update user profile:', e);
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

  const toggleFavorite = async (placeId) => {
    if (!currentUser) return;
    
    let updatedFavorites = [];
    setUserProfile((prev) => {
      if (!prev) return null;
      const exists = prev.favorites.includes(placeId);
      updatedFavorites = exists
        ? prev.favorites.filter((id) => id !== placeId)
        : [...prev.favorites, placeId];
      return { ...prev, favorites: updatedFavorites };
    });

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { favorites: updatedFavorites }, { merge: true });
    } catch (e) {
      console.error('Failed to update favorites in Firestore:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        loginWithGoogle,
        logout,
        updateUserProfile,
        toggleUserVerificationByAdmin,
        toggleFavorite
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
