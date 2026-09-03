import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analytics } from '../firebase/config';
import { logEvent } from 'firebase/analytics';

export default function useVisitorLogging() {
  const location = useLocation();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Generate a unique session ID for the browser session (optional since GA4 handles sessions, but good for custom dimensions if needed)
    let sessionId = sessionStorage.getItem('cebugo_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('cebugo_session_id', sessionId);
    }

    const logVisit = () => {
      try {
        if (analytics) {
          logEvent(analytics, 'page_view', {
            page_path: location.pathname,
            page_search: location.search,
            user_agent: navigator.userAgent,
            user_id: currentUser ? currentUser.uid : 'guest',
            session_id: sessionId
          });
        }
      } catch (err) {
        console.error('Failed to log visit to GA4:', err);
      }
    };

    // To prevent excessive tracking from rapid redirects
    const timeoutId = setTimeout(() => {
      logVisit();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search, currentUser]);
}
