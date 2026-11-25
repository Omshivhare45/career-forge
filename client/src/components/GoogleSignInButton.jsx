import { useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { loginDestination } from '../utils/guestNavigation';

export default function GoogleSignInButton({ next }) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const pending = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      {isLoading ? <p role="status" className="py-2 text-sm font-bold text-[var(--brand-green)]">Signing you in...</p> : (
        <GoogleLogin theme="outline" shape="pill" size="large" text="continue_with" width="240"
          onSuccess={async ({ credential }) => {
            if (pending.current) return;
            if (!credential) { toast.error('Google did not return a credential'); return; }
            pending.current = true;
            setIsLoading(true);
            try {
              const data = await googleLogin(credential);
              toast.success('Welcome to CareerForge!');
              navigate(loginDestination(next, data.user), { replace: true });
            } catch (error) {
              toast.error(error.response?.data?.message || 'Google login failed. Please try again.');
            } finally {
              pending.current = false;
              setIsLoading(false);
            }
          }}
          onError={() => toast.error('Google Sign-In failed. Please try again.')} />
      )}
    </div>
  );
}
