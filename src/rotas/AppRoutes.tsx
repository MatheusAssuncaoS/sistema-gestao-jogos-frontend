import { Navigate, Route, Routes } from 'react-router-dom';

import { LoginPage } from '../paginas/LoginPage';
import { CadastroPage } from '../paginas/CadastroPage';
import { RecuperarSenhaPage } from '../paginas/RecuperarSenhaPage';
import { JogadorHome } from '../paginas/JogadorHome';
import { OrganizadorHome } from '../paginas/OrganizadorHome';
import { AdminHome } from '../paginas/AdminHome';
import { NaoEncontradaPage } from '../paginas/NaoEncontradaPage';

/**
 * Esqueleto das rotas por perfil.
 *
 * A proteção por papel (redirecionar quem não deveria estar aqui) entra no
 * Marco 1, junto com o AuthContext. Por enquanto todas as áreas são
 * acessíveis para provar que o roteamento funciona.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />

      <Route path="/partidas" element={<JogadorHome />} />
      <Route path="/organizador" element={<OrganizadorHome />} />
      <Route path="/admin" element={<AdminHome />} />

      <Route path="*" element={<NaoEncontradaPage />} />
    </Routes>
  );
}
