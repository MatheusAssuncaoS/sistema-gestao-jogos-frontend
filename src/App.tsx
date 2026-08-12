import { BrowserRouter } from 'react-router-dom';

import { AppRoutes } from './rotas/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
