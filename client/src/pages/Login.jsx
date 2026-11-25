
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { validatedReturnPath } from '../utils/guestNavigation';
import logoImg from '../assets/logo.png';
import { BsLightningFill } from 'react-icons/bs';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Login = () => {
  const [params] = useSearchParams();
  const next = params.get('next');

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div
      className="min-h-screen bg-[var(--land-bg-alt)] flex items-center justify-center p-6 selection:bg-[var(--brand-green-light)] selection:text-[var(--brand-green)]"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-green-light)] rounded-bl-full -z-10 opacity-70" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-100 rounded-tr-full -z-10 opacity-70" />

      <div className="max-w-[440px] w-full relative z-10">
        <div className="text-center mb-10">
          <Link
            to="/"
            className="inline-block w-14 h-14 rounded-2xl shadow-[var(--shadow-bubbly)] mb-6 transform hover:-translate-y-1 transition-transform overflow-hidden"
          >
            <img
              src={logoImg}
              alt="CareerForge Logo"
              className="w-full h-full object-cover"
            />
          </Link>

          <h2 className="text-3xl font-black text-[var(--land-text)] tracking-tight mb-2">
            Welcome Back Geeks!
          </h2>

          <div className="flex items-center justify-center gap-2 text-[var(--land-nav)] font-bold">
            <BsLightningFill className="text-[var(--brand-orange)]" />
            <span>Ready to level up your career?</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
          <div className="w-full flex flex-col items-center">
            <GoogleSignInButton next={next} />

            <p className="text-[10px] text-gray-400 mt-2.5 font-bold text-center">
              Fastest & most secure way to sign in
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Sign in to save progress and run code.
            </p>
            <Link to={validatedReturnPath(next) || "/dashboard"}
              className="btn-secondary mt-4 inline-flex justify-center w-full px-4 py-3">
              Explore as Guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
