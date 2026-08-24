import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function useVisitorLogging() {
  const location = useLocation();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Generate a unique session ID for the browser session
    let sessionId = sessionStorage.getItem('cebugo_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('cebugo_session_id', sessionId);
    }

    const logVisit = async () => {
      try {
        await addDoc(collection(db, 'cebugo_visitor_logs'), {
          path: location.pathname,
          search: location.search,
          userAgent: navigator.userAgent,
          language: navigator.language || '알 수 없음',
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          referrer: document.referrer || '직접 접속(북마크/URL입력 등)',
          uid: currentUser ? currentUser.uid : 'guest',
          sessionId,
          timestamp: serverTimestamp(),
          clientTime: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to log visit:', err);
      }
    };

    // To prevent excessive writes from rapid redirects
    const timeoutId = setTimeout(() => {
      logVisit();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search, currentUser]);
}
