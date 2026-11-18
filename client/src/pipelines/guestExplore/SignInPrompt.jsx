import { Link } from 'react-router-dom';
import { FiLock, FiX } from 'react-icons/fi';

const SignInPrompt = ({ onClose, title = 'Keep learning with CareerForge', message }) => (
  <div
    className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
    role="presentation"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-signin-title"
      className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close sign-in prompt"
        className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
      >
        <FiX size={20} />
      </button>
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-2xl text-orange-600">
        <FiLock />
      </div>
      <h2 id="guest-signin-title" className="mb-3 text-2xl font-black text-slate-900">{title}</h2>
      <p className="mb-7 text-sm font-semibold leading-relaxed text-slate-600">{message}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/login" className="flex-1 rounded-xl bg-[var(--brand-green)] px-5 py-3 font-extrabold text-white transition hover:bg-[var(--brand-green-hover)]">
          Sign In
        </Link>
        <Link to="/signup" className="flex-1 rounded-xl border border-slate-200 px-5 py-3 font-extrabold text-slate-700 transition hover:bg-slate-50">
          Create Account
        </Link>
      </div>
    </section>
  </div>
);

export default SignInPrompt;
