import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginPath } from '../utils/guestNavigation';

export function useSignInPrompt() {
  const location = useLocation();
  return (message = 'Sign in to save your progress.') => {
    toast((item) => (
      <div className="flex items-center gap-3 text-sm">
        <span>{message}</span>
        <Link to={loginPath(location)} onClick={() => toast.dismiss(item.id)}
          className="shrink-0 font-black text-emerald-700 underline">Sign In</Link>
      </div>
    ), { id: 'guest-sign-in', duration: 6500 });
  };
}
