
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import api, { setApiSessionToken } from '../api/axios';

const AuthContext = createContext(null);

// Share only an outstanding verification. A later mutation can request a fresh user.
const verifications = new Map();
function verify(token) {
  if (!verifications.has(token)) {
    const request = api.get('/auth/me', { headers: { Authorization: 'Bearer ' + token } })
      .finally(() => verifications.delete(token));
    verifications.set(token, request);
  }
  return verifications.get(token);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('cf_token')));

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token = localStorage.getItem('cf_token');
      localStorage.removeItem('cf_user');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await verify(token);

        if (!cancelled && localStorage.getItem('cf_token') === token) {
          setApiSessionToken(token);
          setUser(data.user);
        }
      } catch (error) {
        // Do not erase saved credentials on network/server errors.
        // A definitive 401 means the token is not accepted.
        if (!cancelled && localStorage.getItem("cf_token") === token && error.response?.status === 401) {
          setApiSessionToken(null);
          localStorage.removeItem('cf_token');
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const googleLogin = async (googleToken) => {
    const { data } = await api.post('/auth/google', {
      token: googleToken,
    });

    setApiSessionToken(data.token);
    localStorage.setItem('cf_token', data.token);
    setUser(data.user);

    return data;
  };

  const logout = useCallback(() => {
    setApiSessionToken(null);
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('cf_token');
    if (!token) return null;
    const { data } = await verify(token);
    if (localStorage.getItem('cf_token') !== token) return null;

    setUser(data.user);

    return data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        googleLogin,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
