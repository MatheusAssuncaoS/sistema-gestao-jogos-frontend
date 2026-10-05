import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { EncaminhamentoInicial } from './EncaminhamentoInicial';
import { RotaPorPapel } from './RotaPorPapel';
import { RotaProtegida } from './RotaProtegida';

const Layout = lazy(() => import('../componentes/Layout').then((modulo) => ({ default: modulo.Layout })));
const AdminLayout = lazy(() => import('../componentes/AdminLayout').then((modulo) => ({ default: modulo.AdminLayout })));
const AdminHome = lazy(() => import('../paginas/AdminHome').then((modulo) => ({ default: modulo.AdminHome })));
const AdminPerfilFormPage = lazy(() => import('../paginas/AdminPerfilFormPage').then(modulo => ({ default: modulo.AdminPerfilFormPage })));
const AdminPerfisAcessoPage = lazy(() => import('../paginas/AdminPerfisAcessoPage').then(modulo => ({ default: modulo.AdminPerfisAcessoPage })));
const AdminCriarUsuarioPage = lazy(() => import('../paginas/AdminCriarUsuarioPage').then(modulo => ({ default: modulo.AdminCriarUsuarioPage })));
const AdminCriarJogadorPage = lazy(() => import('../paginas/AdminCriarJogadorPage').then(modulo => ({ default: modulo.AdminCriarJogadorPage })));
const AdminEditarUsuarioPage = lazy(() => import('../paginas/AdminEditarUsuarioPage').then(modulo => ({ default: modulo.AdminEditarUsuarioPage })));
const AdminUsuariosPage = lazy(() => import('../paginas/AdminUsuariosPage').then((modulo) => ({ default: modulo.AdminUsuariosPage })));
const AdminJogadoresPage = lazy(() => import('../paginas/AdminJogadoresPage').then((modulo) => ({ default: modulo.AdminJogadoresPage })));
const AdminSuspensoesPage = lazy(() => import('../paginas/AdminSuspensoesPage').then((modulo) => ({ default: modulo.AdminSuspensoesPage })));
const AdminTiposSuspensaoPage = lazy(() => import('../paginas/AdminTiposSuspensaoPage').then((modulo) => ({ default: modulo.AdminTiposSuspensaoPage })));
const AdminCriarSuspensaoPage = lazy(() => import('../paginas/AdminCriarSuspensaoPage').then((modulo) => ({ default: modulo.AdminCriarSuspensaoPage })));
const AdminPartidasPage = lazy(() => import('../paginas/AdminPartidasPage').then((modulo) => ({ default: modulo.AdminPartidasPage })));
const AdminNovaPartidaPage = lazy(() => import('../paginas/AdminNovaPartidaPage').then((modulo) => ({ default: modulo.AdminNovaPartidaPage })));
const AdminEditarPartidaPage = lazy(() => import('../paginas/AdminEditarPartidaPage').then((modulo) => ({ default: modulo.AdminEditarPartidaPage })));
const AdminCadastrosPage = lazy(() => import('../paginas/AdminCadastrosPage').then((modulo) => ({ default: modulo.AdminCadastrosPage })));
const AdminMinhaContaPage = lazy(() => import('../paginas/AdminMinhaContaPage').then((modulo) => ({ default: modulo.AdminMinhaContaPage })));
const AdminConfiguracaoListaPage = lazy(() => import('../paginas/AdminConfiguracaoListaPage').then((modulo) => ({ default: modulo.AdminConfiguracaoListaPage })));
const AdminConfiguracaoFormPage = lazy(() => import('../paginas/AdminConfiguracaoFormPage').then((modulo) => ({ default: modulo.AdminConfiguracaoFormPage })));
const AdminCalendarioPage = lazy(() => import('../paginas/AdminCalendarioPage').then((modulo) => ({ default: modulo.AdminCalendarioPage })));
const ArbitroPage = lazy(() => import('../paginas/ArbitroPage').then((modulo) => ({ default: modulo.ArbitroPage })));
const CadastroPage = lazy(() => import('../paginas/CadastroPage').then((modulo) => ({ default: modulo.CadastroPage })));
const JogadorHome = lazy(() => import('../paginas/JogadorHome').then((modulo) => ({ default: modulo.JogadorHome })));
const LoginPage = lazy(() => import('../paginas/LoginPage').then((modulo) => ({ default: modulo.LoginPage })));
const MinhasInscricoesPage = lazy(() => import('../paginas/MinhasInscricoesPage').then((modulo) => ({ default: modulo.MinhasInscricoesPage })));
const MeusDadosPage = lazy(() => import('../paginas/MeusDadosPage').then((modulo) => ({ default: modulo.MeusDadosPage })));
const NaoEncontradaPage = lazy(() => import('../paginas/NaoEncontradaPage').then((modulo) => ({ default: modulo.NaoEncontradaPage })));
const RecuperarSenhaPage = lazy(() => import('../paginas/RecuperarSenhaPage').then((modulo) => ({ default: modulo.RecuperarSenhaPage })));
const TrocarSenhaPage = lazy(() => import('../paginas/TrocarSenhaPage').then((modulo) => ({ default: modulo.TrocarSenhaPage })));

function CarregandoRota() {
  return <div className="route-loading" role="status" aria-live="polite"><span />Carregando…</div>;
}

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
    <Suspense fallback={<CarregandoRota />}>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
      {import.meta.env.DEV && <Route path="/__design-preview" element={<AdminLayout />}><Route index element={<AdminHome />} /></Route>}

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

          <Route path="/organizador" element={<Navigate to="/admin/partidas" replace />} />

          <Route element={<RotaPorPapel papelExigido="ARBITRO" />}>
            <Route path="/arbitro" element={<ArbitroPage />} />
          </Route>

          <Route element={<RotaPorPapel papelExigido="ADMINISTRADOR" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="seguranca/perfis/novo" element={<AdminPerfilFormPage />} />
              <Route path="seguranca/perfis/:perfilId" element={<AdminPerfilFormPage />} />
              <Route path="seguranca/perfis" element={<AdminPerfisAcessoPage />} />
              <Route path="seguranca/usuarios/novo" element={<AdminCriarUsuarioPage />} />
              <Route path="seguranca/usuarios/:usuarioId" element={<AdminEditarUsuarioPage />} />
              <Route path="seguranca/usuarios" element={<AdminUsuariosPage />} />
              <Route path="usuarios" element={<AdminJogadoresPage />} />
              <Route path="usuarios/novo" element={<AdminCriarJogadorPage />} />
              <Route path="suspensoes" element={<AdminSuspensoesPage />} />
              <Route path="configuracoes/tipos-suspensao" element={<AdminTiposSuspensaoPage />} />
              <Route path="suspensoes/nova" element={<AdminCriarSuspensaoPage />} />
              <Route path="usuarios/:usuarioId" element={<AdminEditarUsuarioPage />} />
              <Route path="cadastros" element={<AdminCadastrosPage />} />
              <Route path="jogadores" element={<Navigate to="/admin/usuarios" replace />} />
              <Route path="organizadores" element={<Navigate to="/admin/usuarios" replace />} />
              <Route path="partidas" element={<AdminPartidasPage visualizacaoInicial="lista" />} />
              <Route path="partidas/calendario" element={<AdminPartidasPage visualizacaoInicial="calendario" />} />
              <Route path="partidas/nova" element={<AdminNovaPartidaPage />} />
              <Route path="partidas/:partidaId" element={<AdminEditarPartidaPage />} />
              <Route path="configuracoes" element={<Navigate to="/admin/configuracoes/modalidades" replace />} />
              <Route path="configuracoes/modalidades" element={<AdminConfiguracaoListaPage tipo="modalidades" />} />
              <Route path="configuracoes/modalidades/:itemId" element={<AdminConfiguracaoFormPage tipo="modalidades" />} />
              <Route path="configuracoes/locais" element={<AdminConfiguracaoListaPage tipo="locais" />} />
              <Route path="configuracoes/locais/:itemId" element={<AdminConfiguracaoFormPage tipo="locais" />} />
              <Route path="configuracoes/categorias" element={<AdminConfiguracaoListaPage tipo="categorias" />} />
              <Route path="configuracoes/categorias/:itemId" element={<AdminConfiguracaoFormPage tipo="categorias" />} />
              <Route path="configuracoes/calendario" element={<AdminCalendarioPage />} />
              <Route path="configuracoes/calendario/:bloqueioId" element={<AdminCalendarioPage />} />
              <Route path="configuracoes/calendario/nova" element={<Navigate to="/admin/configuracoes/calendario/novo" replace />} />
              <Route path="perfil" element={<AdminMinhaContaPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NaoEncontradaPage />} />
      </Routes>
    </Suspense>
  );
}
