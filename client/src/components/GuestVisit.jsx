import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { recordAudience } from '../utils/audience';

export default function GuestVisit() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => {
    if (!loading && !user) recordAudience('guest');
  }, [loading, user, pathname]);
  return null;
}
