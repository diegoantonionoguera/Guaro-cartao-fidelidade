import { store } from '../store';
export function renderManagerPanel() {
    const isGerente = store.currentUser.perfil === 'gerente';
    if (!isGerente) {
        return `
      <div class="bg-red-950/40 border border-red-500/30 rounded-3xl p-8 text-center space-y-4 backdrop-blur-md max-w-xl mx-auto my-12">
        <div class="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h2 class="text-xl font-extrabold text-white">Acesso Restrito ao Gerente</h2>
        <p class="text-xs text-zinc-400 font-sans leading-relaxed">
          O perfil atual "<strong>${store.currentUser.nome}</strong>" (${store.currentUser.perfil}) não possui permissão para acessar o painel de gerenciamento, aprovações de excedentes e configurações avançadas.
        </p>
        <button
          id="btn-switch-to-manager"
          class="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xl inline-flex items-center space-x-2"
        >
          <span>Alternar para Carlos Eduardo (Gerente)</span>
        </button>
      </div>
    `;
    }
    const activeSubTab = store.managerSubTab;
    const pendingTxs = store.transactions.filter(t => t.status === 'pendente');
    const approvedTxs = store.transactions.filter(t => t.status === 'aprovado');
    const confirmedRds = store.redemptions.filter(r => r.status === 'confirmado');
    const auditSearch = store.auditSearchQuery.toLowerCase().trim();
    const filteredAuditLogs = store.auditLogs.filter(log => {
        if (!auditSearch)
            return true;
        return (log.usuarioNome.toLowerCase().includes(auditSearch) ||
            log.detalhes.toLowerCase().includes(auditSearch) ||
            (log.comandaRef && log.comandaRef.toLowerCase().includes(auditSearch)) ||
            (log.clienteRef && log.clienteRef.toLowerCase().includes(auditSearch)));
    });
    // Calculate analytics
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const totalPontosLancadosHoje = store.transactions
        .filter(t => t.status === 'aprovado' && new Date(t.dataHora) >= startOfToday)
        .reduce((acc, t) => acc + t.pontosGerados, 0);
    const totalResgatesConfirmados = store.redemptions
        .filter(r => r.status === 'confirmado')
        .reduce((acc, r) => acc + r.pontosUtilizados, 0);
    const totalVendasAcumuladas = store.transactions
        .filter(t => t.status === 'aprovado')
        .reduce((acc, t) => acc + t.valorCompra, 0);
    return `
    <div class="space-y-6">
      
      <!-- Header Banner -->
      <section class="manager-hero surface-enter p-5 sm:p-7 rounded-2xl flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <div class="flex items-center space-x-2">
            <span class="p-1.5 bg-white/10 text-amber-400 rounded-xl border border-white/20">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </span>
            <h1 class="text-2xl sm:text-3xl text-white">Painel gerencial</h1>
          </div>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-2xl">Aprovações, equipe, recompensas e indicadores da operação em um só lugar.</p>
        </div>

        <!-- Tab Selection -->
        <nav aria-label="Seções da gerência" class="flex items-center space-x-1 bg-black/45 p-1.5 rounded-xl ring-1 ring-white/10 overflow-x-auto whitespace-nowrap max-w-full">
          <button
            data-manager-subtab="pendentes"
            class="px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${activeSubTab === 'pendentes' ? 'bg-white text-black font-extrabold' : 'text-zinc-400 hover:text-white'}"
          >
            <span>Pendentes (${pendingTxs.length})</span>
          </button>

          <button
            data-manager-subtab="estornos"
            class="px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${activeSubTab === 'estornos' ? 'bg-white text-black font-extrabold' : 'text-zinc-400 hover:text-white'}"
          >
            <span>Estornos</span>
          </button>

          <button
            data-manager-subtab="usuarios"
            class="px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${activeSubTab === 'usuarios' ? 'bg-white text-black font-extrabold' : 'text-zinc-400 hover:text-white'}"
          >
            <span>Usuários (${store.users.length})</span>
          </button>

          <button
            data-manager-subtab="cupons"
            class="px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${activeSubTab === 'cupons' ? 'bg-white text-black font-extrabold' : 'text-zinc-400 hover:text-white'}"
          >
            <span>Cupons (${store.coupons.length})</span>
          </button>

          <button
            data-manager-subtab="relatorios"
            class="px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${activeSubTab === 'relatorios' ? 'bg-white text-black font-extrabold' : 'text-zinc-400 hover:text-white'}"
          >
            <span>Relatórios</span>
          </button>

          <button
            data-manager-subtab="config"
            class="px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${activeSubTab === 'config' ? 'bg-white text-black font-extrabold' : 'text-zinc-400 hover:text-white'}"
          >
            <span>Configurações</span>
          </button>

          <button
            data-manager-subtab="auditoria"
            class="px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${activeSubTab === 'auditoria' ? 'bg-white text-black font-extrabold' : 'text-zinc-400 hover:text-white'}"
          >
            <span>Auditoria</span>
          </button>
        </nav>
      </section>

      <!-- SUBTAB 1: PENDENTES DE APROVAÇÃO -->
      ${activeSubTab === 'pendentes' ? `
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Aguardando Aprovação do Gerente (${pendingTxs.length})
            </h2>
          </div>

          ${pendingTxs.length === 0 ? `
            <div class="bg-[#09090b] border border-white/10 rounded-3xl p-10 text-center space-y-2 backdrop-blur-md">
              <svg class="w-10 h-10 text-emerald-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <h3 class="text-base font-extrabold text-white">Nenhum Lançamento Pendente</h3>
              <p class="text-xs text-zinc-400">
                Todos os lançamentos que excederam a cota dos atendentes foram devidamente auditados.
              </p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${pendingTxs.map(tx => `
                <div class="bg-[#09090b] border border-white/20 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden backdrop-blur-md">
                  <div class="absolute top-0 right-0 bg-white text-black text-[9px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                    Excedente
                  </div>

                  <div>
                    <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Atendente Solicitante</div>
                    <div class="text-sm font-bold text-white flex items-center space-x-2">
                      <span>${tx.usuarioNome}</span>
                      <span class="text-zinc-600">•</span>
                      <span class="text-amber-400 font-mono">${tx.numeroComanda}</span>
                    </div>
                  </div>

                  <div class="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2 font-mono">
                    <div class="flex justify-between text-xs">
                      <span class="text-zinc-400 font-sans">Cliente:</span>
                      <span class="font-bold text-white font-sans">${tx.clienteNome} (${tx.clienteTelefone})</span>
                    </div>
                    <div class="flex justify-between text-xs">
                      <span class="text-zinc-400 font-sans">Valor da Compra:</span>
                      <span class="font-bold text-emerald-400">R$ ${tx.valorCompra.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between text-xs pt-1 border-t border-white/10">
                      <span class="text-zinc-400 font-sans">Pontos a Creditar:</span>
                      <span class="font-black text-amber-400 text-sm">+${tx.pontosGerados} pts</span>
                    </div>
                  </div>

                  <div class="text-[11px] text-zinc-400 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5 font-mono">
                    "${tx.motivoPendente}"
                  </div>

                  <div class="flex items-center space-x-2 pt-1">
                    <button
                      data-action="reject-tx"
                      data-tx-id="${tx.id}"
                      class="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-red-400 hover:text-red-300 font-bold rounded-xl text-[10px] uppercase tracking-wider border border-white/10 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Rejeitar</span>
                    </button>

                    <button
                      data-action="approve-tx"
                      data-tx-id="${tx.id}"
                      class="flex-1 py-2.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl text-[10px] uppercase tracking-wider shadow-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Aprovar</span>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      ` : ''}

      <!-- SUBTAB 2: ESTORNOS -->
      ${activeSubTab === 'estornos' ? `
        <div class="space-y-6">
          <div class="space-y-3">
            <h2 class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Lançamentos Aprovados Recentes (Elegíveis p/ Estorno)
            </h2>

            ${approvedTxs.length === 0 ? `
              <p class="text-xs text-zinc-500 font-mono italic">Nenhum lançamento aprovado elegível para estorno.</p>
            ` : `
              <div class="space-y-2">
                ${approvedTxs.map(tx => `
                  <div class="bg-[#09090b] border border-white/10 p-4 rounded-2xl flex items-center justify-between text-xs backdrop-blur-md">
                    <div>
                      <div class="flex items-center space-x-2 font-bold text-white">
                        <span class="text-amber-400 font-mono">${tx.numeroComanda}</span>
                        <span class="text-zinc-600">•</span>
                        <span>Cliente: ${tx.clienteNome} (${tx.clienteTelefone})</span>
                      </div>
                      <div class="text-[11px] text-zinc-400 font-mono mt-0.5">
                        R$ ${tx.valorCompra.toFixed(2)} • +${tx.pontosGerados} pts • Op: ${tx.usuarioNome} em ${new Date(tx.dataHora).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <button
                      data-action="open-estorno-tx"
                      data-tx-id="${tx.id}"
                      class="bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      <span>Estornar</span>
                    </button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <div class="space-y-3 pt-4 border-t border-white/10">
            <h2 class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Resgates Confirmados Recentes (Elegíveis p/ Estorno)
            </h2>

            ${confirmedRds.length === 0 ? `
              <p class="text-xs text-zinc-500 font-mono italic">Nenhum resgate confirmado elegível para estorno.</p>
            ` : `
              <div class="space-y-2">
                ${confirmedRds.map(rd => `
                  <div class="bg-[#09090b] border border-white/10 p-4 rounded-2xl flex items-center justify-between text-xs backdrop-blur-md">
                    <div>
                      <div class="flex items-center space-x-2 font-bold text-white">
                        <span class="text-emerald-400 font-mono">Desconto R$ ${rd.valorDescontoReais.toFixed(2)}</span>
                        <span class="text-zinc-600">•</span>
                        <span>Cliente: ${rd.clienteNome}</span>
                      </div>
                      <div class="text-[11px] text-zinc-400 font-mono mt-0.5">
                        -${rd.pontosUtilizados} pts • SMS ${rd.codigoConfirmacao} • Op: ${rd.usuarioNome} em ${new Date(rd.dataHora).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <button
                      data-action="open-estorno-rd"
                      data-rd-id="${rd.id}"
                      class="bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      <span>Estornar</span>
                    </button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      ` : ''}

      <!-- SUBTAB 3: GESTÃO DE USUÁRIOS E ATENDENTES -->
      ${activeSubTab === 'usuarios' ? `
        <div class="space-y-6">
          <div class="section-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl">
            <div>
              <h2 class="text-xl sm:text-2xl text-white">Equipe e acessos</h2>
              <p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">Gerencie atendentes, gerentes e os limites diários de lançamento.</p>
            </div>
            <button
              data-action="add-user"
              class="px-4 py-2.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center space-x-1.5 shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              <span>Criar usuário</span>
            </button>
          </div>

          <div class="team-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            ${store.users.map(u => {
        const pontosLancadosHoje = store.getPontosLancadosHoje(u.id);
        const isSelf = u.id === store.currentUser.id;
        const isGerente = u.perfil === 'gerente';
        const iniciais = u.nome.split(' ').filter(Boolean).slice(0, 2).map(parte => parte[0]).join('').toUpperCase();
        return `
                <article class="team-card surface-enter rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col justify-between">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center space-x-3">
                      <div class="team-avatar" aria-hidden="true">${iniciais}</div>
                      <div class="min-w-0">
                        <h3 class="font-sans font-semibold text-white text-sm leading-tight truncate">${u.nome}</h3>
                        <p class="text-xs text-zinc-400 mt-1">@${u.login}</p>
                      </div>
                    </div>
                    <span class="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${isGerente ? 'bg-amber-400/10 text-amber-300 border-amber-400/30' : 'bg-blue-400/10 text-blue-300 border-blue-400/30'}">
                      ${u.perfil}
                    </span>
                  </div>

                  <div class="team-metrics -mx-5 sm:-mx-6 px-5 sm:px-6 py-4 space-y-2 text-xs">
                    <div class="flex justify-between">
                      <span class="text-zinc-400">Cota diária</span>
                      <span class="font-semibold tabular-nums text-amber-300">${u.cotaDiariaPontos} pts</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-zinc-400">Lançados hoje</span>
                      <span class="font-semibold tabular-nums text-emerald-300">${pontosLancadosHoje} pts</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      data-action="edit-user"
                      data-user-id="${u.id}"
                      class="flex-1 py-2 bg-white/5 hover:bg-white/15 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider border border-white/10 transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      <span>Editar</span>
                    </button>

                    ${!isSelf ? `
                      <button
                        data-action="delete-user"
                        data-user-id="${u.id}"
                        class="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-[10px] uppercase tracking-wider border border-red-500/20 transition-all cursor-pointer"
                        title="Excluir Usuário"
                      >
                        Excluir
                      </button>
                    ` : ''}
                  </div>
                </article>
              `;
    }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- SUBTAB 4: CATÁLOGO DE CUPONS E RECOMPENSAS -->
      ${activeSubTab === 'cupons' ? `
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#09090b]/60 p-4 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div>
              <h2 class="text-base font-extrabold text-white flex items-center gap-2">
                <span>🏷️ Catálogo de Cupons & Recompensas</span>
              </h2>
              <p class="text-xs text-zinc-400 mt-0.5">Crie novos cupons, edite regras e escolha quantos pontos são necessários para resgatá-los no caixa.</p>
            </div>
            <button
              data-action="add-coupon"
              class="px-4 py-2.5 bg-amber-400 text-black hover:bg-amber-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-400/20 flex items-center space-x-1.5 shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span>+ Criar Novo Cupom</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${store.coupons.map(c => `
              <div class="bg-[#09090b] border border-white/10 hover:border-white/20 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between relative overflow-hidden ${!c.ativo ? 'opacity-50' : ''}">
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <span class="px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${c.ativo ? 'bg-emerald-950 text-white border-emerald-500/30' : 'bg-zinc-800 text-white border-zinc-600'}">
                      ${c.ativo ? '● Ativo' : '○ Inativo'}
                    </span>
                    <span class="text-xl font-black text-amber-400 font-mono">
                      ${c.pontosNecessarios} <span class="text-xs text-zinc-400">pts</span>
                    </span>
                  </div>

                  <h3 class="text-base font-extrabold text-white mt-3 font-sans">${c.titulo}</h3>
                  <p class="text-xs text-zinc-400 mt-1 font-sans leading-relaxed">${c.descricao}</p>
                </div>

                <div class="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono">
                  <span class="text-zinc-400">Desconto Equivalente:</span>
                  <span class="font-bold text-emerald-400 text-sm">R$ ${c.valorDescontoReais.toFixed(2)}</span>
                </div>

                <div class="flex items-center space-x-2 pt-2 border-t border-white/5">
                  <button
                    data-action="toggle-coupon"
                    data-coupon-id="${c.id}"
                    class="py-2 px-3 bg-white/5 hover:bg-white/15 text-zinc-300 font-bold rounded-xl text-[10px] uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
                  >
                    ${c.ativo ? 'Desativar' : 'Ativar'}
                  </button>

                  <button
                    data-action="edit-coupon"
                    data-coupon-id="${c.id}"
                    class="flex-1 py-2 bg-white/5 hover:bg-white/15 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider border border-white/10 transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    <span>Editar</span>
                  </button>

                  <button
                    data-action="delete-coupon"
                    data-coupon-id="${c.id}"
                    class="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-[10px] uppercase tracking-wider border border-red-500/20 transition-all cursor-pointer"
                    title="Excluir Cupom"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- SUBTAB 5: RELATÓRIOS E MÉTRICAS -->
      ${activeSubTab === 'relatorios' ? `
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="bg-[#09090b] p-5 rounded-2xl border border-white/10 space-y-1 backdrop-blur-md">
              <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Pontos Gerados Hoje</span>
              <div class="text-2xl font-black text-amber-400 font-mono">${totalPontosLancadosHoje} pts</div>
              <div class="text-[10px] text-zinc-500 font-mono">Acumulado em compras</div>
            </div>

            <div class="bg-[#09090b] p-5 rounded-2xl border border-white/10 space-y-1 backdrop-blur-md">
              <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Pontos Resgatados</span>
              <div class="text-2xl font-black text-red-400 font-mono">${totalResgatesConfirmados} pts</div>
              <div class="text-[10px] text-zinc-500 font-mono">Descontos fornecidos</div>
            </div>

            <div class="bg-[#09090b] p-5 rounded-2xl border border-white/10 space-y-1 backdrop-blur-md">
              <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Volume Fidelizado</span>
              <div class="text-2xl font-black text-emerald-400 font-mono">R$ ${totalVendasAcumuladas.toFixed(2)}</div>
              <div class="text-[10px] text-zinc-500 font-mono">Volume de comanda</div>
            </div>

            <div class="bg-[#09090b] p-5 rounded-2xl border border-white/10 space-y-1 backdrop-blur-md">
              <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Base de Clientes</span>
              <div class="text-2xl font-black text-white font-mono">${store.clients.length} clientes</div>
              <div class="text-[10px] text-zinc-500 font-mono">Cadastrados no sistema</div>
            </div>

          </div>

          <!-- Recharts Bar Chart Container -->
          <div id="recharts-sales-volume-mount" class="bg-[#09090b] p-6 rounded-3xl border border-white/10 backdrop-blur-md"></div>

          <div class="bg-[#09090b] p-6 rounded-3xl border border-white/10 space-y-4 backdrop-blur-md">
            <h3 class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Desempenho por Atendente
            </h3>

            <div class="space-y-3">
              ${store.users.map(u => {
        const ptsUser = store.getPontosLancadosHoje(u.id);
        const countUser = store.transactions.filter(t => t.status === 'aprovado' && t.usuarioId === u.id).length;
        const clientCreatedCount = store.clients.filter(c => c.criadoPorUsuarioId === u.id).length;
        // Count frequent clients created by this attendant
        const clientTxCounts = new Map();
        store.transactions.filter(t => t.status === 'aprovado').forEach(t => {
            clientTxCounts.set(t.clienteId, (clientTxCounts.get(t.clienteId) || 0) + 1);
        });
        const frequentCount = store.clients.filter(c => {
            if (c.criadoPorUsuarioId !== u.id)
                return false;
            const purchases = clientTxCounts.get(c.id) || 0;
            return purchases >= 2 || c.totalGastoHistorico >= 100 || c.nivel !== 'Bronze';
        }).length;
        return `
                  <div class="bg-black/40 p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 rounded-xl bg-white/10 text-white font-black text-sm flex items-center justify-center border border-white/20 shrink-0">
                        ${u.nome.charAt(0)}
                      </div>
                      <div>
                        <div class="text-sm font-bold text-white font-sans">${u.nome}</div>
                        <div class="text-xs text-zinc-400 capitalize">${u.perfil} • ${countUser} comandas</div>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2 min-[420px]:text-right">
                      <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                        <span class="text-[9px] text-zinc-500 uppercase block font-bold">Novas Contas</span>
                        <strong class="text-xs text-blue-400 font-bold">${clientCreatedCount} criadas</strong>
                      </div>
                      <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                        <span class="text-[9px] text-zinc-500 uppercase block font-bold">Frequentes</span>
                        <strong class="text-xs text-emerald-400 font-bold">${frequentCount} fiéis</strong>
                      </div>
                      <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                        <span class="text-[9px] text-zinc-500 uppercase block font-bold">Hoje / Cota</span>
                        <strong class="text-xs text-amber-400 font-bold">${ptsUser} / ${u.cotaDiariaPontos} pts</strong>
                      </div>
                    </div>
                  </div>
                `;
    }).join('')}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- SUBTAB 4: CONFIGURAÇÕES DO SISTEMA -->
      ${activeSubTab === 'config' ? `
        <form id="form-system-config" class="bg-[#09090b] p-6 rounded-3xl border border-white/10 space-y-6 max-w-2xl backdrop-blur-md">
          <div class="border-b border-white/10 pb-3">
            <h2 class="text-base font-extrabold text-white">Parâmetros do Programa</h2>
            <p class="text-xs text-zinc-400">Ajuste as taxas de conversão, limites e regras globais.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Taxa de Conversão (Pontos / R$ 1)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                name="taxaConversao"
                value="${store.config.taxaConversaoReais}"
                class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-white font-mono font-bold"
              />
              <span class="text-[10px] text-zinc-500 font-mono">Padrão: 1.0 (R$ 1 = 1 pt)</span>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Pontos Necessários p/ Resgate
              </label>
              <input
                type="number"
                step="1"
                min="1"
                name="valorResgatePts"
                value="${store.config.valorResgatePontos}"
                class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-white font-mono font-bold"
              />
              <span class="text-[10px] text-zinc-500 font-mono">Padrão: 100 pontos</span>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Valor do Desconto (R$)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                name="valorResgateR$"
                value="${store.config.valorResgateReais}"
                class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-white font-mono font-bold"
              />
              <span class="text-[10px] text-zinc-500 font-mono">Padrão: R$ 10,00</span>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Cota Diária Padrão (pts)
              </label>
              <input
                type="number"
                step="10"
                min="50"
                name="cotaPadrao"
                value="${store.config.cotaDiariaPadrao}"
                class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-white font-mono font-bold"
              />
              <span class="text-[10px] text-zinc-500 font-mono">Padrão: 500 pts/dia</span>
            </div>

            <div class="space-y-1.5 sm:col-span-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Expiração do SMS (Minutos)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                name="expiracaoMin"
                value="${store.config.expiracaoCodigoMinutos}"
                class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-white font-mono font-bold"
              />
              <span class="text-[10px] text-zinc-500 font-mono">Padrão: 5 minutos</span>
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl text-xs uppercase tracking-wider shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Salvar Configuração</span>
          </button>
        </form>
      ` : ''}

      <!-- SUBTAB 5: LOGS DE AUDITORIA -->
      ${activeSubTab === 'auditoria' ? `
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Registros de Auditoria (${filteredAuditLogs.length})
            </h2>

            <div class="relative w-full sm:w-64">
              <input
                type="text"
                id="input-audit-search"
                value="${store.auditSearchQuery}"
                placeholder="Filtrar auditoria..."
                class="w-full pl-3 pr-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:border-white/30"
              />
            </div>
          </div>

          <div class="bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[600px] text-left text-xs text-zinc-300 font-mono">
                <thead class="bg-black/60 text-zinc-400 text-[9px] uppercase font-bold tracking-widest border-b border-white/10">
                  <tr>
                    <th class="p-3">Data/Hora</th>
                    <th class="p-3">Usuário</th>
                    <th class="p-3">Ação</th>
                    <th class="p-3">Detalhes</th>
                    <th class="p-3">Comanda</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  ${filteredAuditLogs.map(log => `
                    <tr class="hover:bg-white/[0.02]">
                      <td class="p-3 text-[11px] text-zinc-400">
                        ${new Date(log.dataHora).toLocaleString('pt-BR')}
                      </td>
                      <td class="p-3 font-bold text-white font-sans">
                        ${log.usuarioNome} (${log.usuarioPerfil})
                      </td>
                      <td class="p-3">
                        <span class="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] font-bold text-amber-400 uppercase tracking-widest">
                          ${log.acao}
                        </span>
                      </td>
                      <td class="p-3 text-zinc-300 max-w-xs truncate font-sans">
                        ${log.detalhes}
                      </td>
                      <td class="p-3 font-mono text-amber-400">
                        ${log.comandaRef || '-'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ` : ''}

    </div>
  `;
}
