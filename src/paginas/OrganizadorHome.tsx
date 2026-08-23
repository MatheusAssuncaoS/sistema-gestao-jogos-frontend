import { GestaoDePartidas } from '../componentes/GestaoDePartidas';
import { PainelOperacionalLayout } from '../componentes/PainelOperacionalLayout';

export function OrganizadorHome() {
  return (
    <PainelOperacionalLayout ambiente="organizador">
      <div className="admin-breadcrumb"><span>Organização</span><b>/</b> Partidas</div>
      <GestaoDePartidas />
    </PainelOperacionalLayout>
  );
}
