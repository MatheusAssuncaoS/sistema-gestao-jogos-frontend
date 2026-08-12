import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './contexto/AuthContext';
import { AppRoutes } from './rotas/AppRoutes';

/**
 * Configuração global do TanStack Query.
 *
 * retry: 1 evita repetir requisições que falharam por regra de negócio (que
 * a segunda tentativa não vai mudar); o refetch em foco fica desligado
 * porque para dados do clube não faz sentido recarregar toda vez que o
 * usuário troca de aba.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
