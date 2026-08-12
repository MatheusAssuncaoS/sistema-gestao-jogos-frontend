import { useContext } from 'react';

import { AuthContext, type AuthContextValue } from './authTypes';

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider.');
  }

  return contexto;
}
