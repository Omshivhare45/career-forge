import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RunSignInContext } from '../context/RunSignInContext';
import { loginPath } from '../utils/guestNavigation';

export default function RunSignInProvider({ children }) {
  const dialog = useRef(null);
  const location = useLocation();
  const signIn = loginPath(location);
  const close = () => dialog.current?.close();
  return (
    <RunSignInContext.Provider value={() => dialog.current?.showModal()}>
      {children}
      <dialog ref={dialog} aria-labelledby="run-sign-in-title" aria-describedby="run-sign-in-detail"
        className="m-auto w-[min(26rem,90vw)] rounded-2xl border border-neutral-700 bg-neutral-950 p-6 text-neutral-100 shadow-xl backdrop:bg-black/70"
        onClick={event => { if (event.target === dialog.current) close(); }}>
        <h2 id="run-sign-in-title" className="text-xl font-bold text-white">Run your code</h2>
        <p id="run-sign-in-detail" className="my-4 text-sm text-neutral-300">Sign in or create an account to execute your program.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link to={signIn} onClick={close} className="rounded-lg bg-orange-400 px-4 py-2 font-bold text-black">Sign in</Link>
          <Link to={signIn.replace('/login?', '/signup?')} onClick={close} className="rounded-lg border border-neutral-600 px-4 py-2 font-semibold">Register</Link>
          <button type="button" onClick={close} className="p-2 text-sm underline">Keep editing</button>
        </div>
      </dialog>
    </RunSignInContext.Provider>
  );
}
