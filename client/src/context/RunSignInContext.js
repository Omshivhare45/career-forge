import { createContext, useContext } from 'react';

export const RunSignInContext = createContext(null);
export const useRunSignIn = () => useContext(RunSignInContext);
