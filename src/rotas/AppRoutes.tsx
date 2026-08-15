import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from '../componentes/Layout';
import { AdminLayout } from '../componentes/AdminLayout';
import { AdminHome } from '../paginas/AdminHome';
import { AdminUsuariosPage } from '../paginas/AdminUsuariosPage';
import { AdminPartidasPage } from '../paginas/AdminPartidasPage';
import { AdminCadastrosPage } from '../paginas/AdminCadastrosPage';
import { AdminMinhaContaPage } from '../paginas/AdminMinhaContaPage';
import { AdminConfiguracaoListaPage } from '../paginas/AdminConfiguracaoListaPage';
import { AdminCalendarioPage } from '../paginas/AdminCalendarioPage';
import { CadastroPage } from '../paginas/CadastroPage';
import { JogadorHome } from '../paginas/JogadorHome';
import { LoginPage } from '../paginas/LoginPage';
import { MinhasInscricoesPage } from '../paginas/MinhasInscricoesPage';
import { MeusDadosPage } from '../paginas/MeusDadosPage';
import { NaoEncontradaPage } from '../paginas/NaoEncontradaPage';
import { OrganizadorHome } from '../paginas/OrganizadorHome';
import { RecuperarSenhaPage } from '../paginas/RecuperarSenhaPage';
import { TrocarSenhaPage } from '../paginas/TrocarSenhaPage';
import { EncaminhamentoInicial } from './EncaminhamentoInicial';
import { RotaPorPapel } from './RotaPorPapel';
import { RotaProtegida } from './RotaProtegida';

/**
 * Três blocos de rotas:
 *
 * - públicas: login, cadastro e recuperação de senha, sem layout, para não
 *   confundir quem ainda não entrou.
 * - autenticadas: qualquer sessão válida ganha o layout com header e o
 *   redirecionamento inicial por papel.
 * - por papel: dentro do bloco autenticado, algumas rotas exigem papel
 *   específico. RotaPorPapel devolve quem não tem para a raiz.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />

      <Route element={<RotaProtegida />}>
        {/* Fora do Layout de propósito: quem tem senha provisória não deve
            ver links de navegação para rotas que ainda não pode acessar. */}
        <Route path="/trocar-senha" element={<TrocarSenhaPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<EncaminhamentoInicial />} />

          {/* /partidas é acessível para qualquer autenticado, porque a página
              sabe mostrar mensagem de "aguardando aprovação" para quem ainda
              não tem o papel JOGADOR. */}
          <Route path="/partidas" element={<JogadorHome />} />
          <Route path="/meus-dados" element={<MeusDadosPage />} />

          <Route element={<RotaPorPapel papelExigido="JOGADOR" />}>
            <Route path="/minhas-inscricoes" element={<MinhasInscricoesPage />} />
          </Route>

          <Route element={<RotaPorPapel papelExigido="ORGANIZADOR" />}>
            <Route path="/organizador" element={<OrganizadorHome />} />
          </Route>

          <Route element={<RotaPorPapel papelExigido="ADMINISTRADOR" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="usuarios" element={<AdminUsuariosPage />} />
              <Route path="cadastros" element={<AdminCadastrosPage />} />
              <Route path="jogadores" element={<Navigate to="/admin/usuarios" replace />} />
              <Route path="organizadores" element={<Navigate to="/admin/usuarios" replace />} />
              <Route path="partidas" element={<AdminPartidasPage />} />
              <Route path="configuracoes" element={<Navigate to="/admin/configuracoes/modalidades" replace />} />
              <Route path="configuracoes/modalidades" element={<AdminConfiguracaoListaPage tipo="modalidades" />} />
              <Route path="configuracoes/locais" element={<AdminConfiguracaoListaPage tipo="locais" />} />
              <Route path="configuracoes/categorias" element={<AdminConfiguracaoListaPage tipo="categorias" />} />
              <Route path="configuracoes/calendario" element={<AdminCalendarioPage />} />
              <Route path="perfil" element={<AdminMinhaContaPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NaoEncontradaPage />} />
    </Routes>
  );
}
