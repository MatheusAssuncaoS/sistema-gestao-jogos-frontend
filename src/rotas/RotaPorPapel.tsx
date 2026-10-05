import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexto/useAuth';
import { acessoAdministrativo, permissaoDaRota, pode } from '../seguranca/permissoes';
import type { Papel } from '../servicos/tipos';

export function RotaPorPapel({ papelExigido }: { papelExigido: Papel }) {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const autorizado = papelExigido === 'ADMINISTRADOR' ? acessoAdministrativo(usuario)
    : papelExigido === 'ORGANIZADOR' ? pode(usuario, 'PARTIDAS_VISUALIZAR')
    : papelExigido === 'ARBITRO' ? pode(usuario, 'ARBITRAGEM_VISUALIZAR')
    : pode(usuario, 'INSCRICOES_VISUALIZAR');
  if (!usuario || !autorizado) return <Navigate to="/" replace />;
  const permissao = papelExigido === 'ADMINISTRADOR' ? permissaoDaRota(pathname) : undefined;
  if (permissao && !pode(usuario, permissao)) return <div className="admin-empty-state"><h1>Acesso não permitido</h1><p>Seu perfil não permite consultar esta área.</p><Link to="/">Voltar ao início</Link></div>;
  return <Outlet />;
}
