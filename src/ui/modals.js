import { store } from '../store';
export function renderModals() {
    const activeModal = store.activeModal;
    if (activeModal === 'none')
        return '';
    if (activeModal === 'new-client')
        return renderNewClientModal();
    if (activeModal === 'add-points')
        return renderAddPointsModal();
    if (activeModal === 'redemption')
        return renderRedemptionModal();
    if (activeModal === 'client-details')
        return renderClientDetailsModal();
    if (activeModal === 'reject-tx')
        return renderRejectTxModal();
    if (activeModal === 'estorno-tx')
        return renderEstornoTxModal();
    if (activeModal === 'estorno-rd')
        return renderEstornoRdModal();
    if (activeModal === 'manager-auth')
        return renderManagerAuthModal();
    if (activeModal === 'user-modal')
        return renderUserModal();
    if (activeModal === 'coupon-modal')
        return renderCouponModal();
    return '';
}
function renderManagerAuthModal() {
    return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="bg-[#09090b] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl transition-all overflow-hidden animate-fade-in-scale">
        
        <!-- Header -->
        <div class="relative bg-white/[0.02] p-4 sm:p-6 border-b border-white/10">
          <button
            id="btn-close-modal"
            class="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10"
          >
            ✕
          </button>
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <div>
              <h2 class="text-base font-extrabold text-white">Autenticação de Gerente</h2>
              <p class="text-xs text-zinc-400">Carlos Eduardo (Gerente)</p>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form id="form-manager-auth" class="p-6 space-y-4">
          <p class="text-xs text-zinc-300 font-sans leading-relaxed">
            Para alterar para o perfil do gerente <strong>Carlos Eduardo</strong>, informe as credenciais de acesso abaixo:
          </p>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
              Login do Gerente
            </label>
            <input
              type="text"
              name="login"
              id="input-manager-login"
              value="177"
              required
              placeholder="Digite o login (ex: 177)"
              class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-sm text-white font-mono placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
              Senha do Gerente
            </label>
            <input
              type="password"
              name="senha"
              id="input-manager-password"
              required
              placeholder="••••••••"
              class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-sm text-white font-mono placeholder-zinc-500 focus:outline-none"
              autofocus
            />
          </div>

          ${store.managerAuthError ? `
            <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-2">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>${store.managerAuthError}</span>
            </div>
          ` : ''}

          <!-- Credential hint box -->
          <div class="p-3 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Credenciais:</span>
            <span>Login: <strong class="text-white">177</strong> | Senha: <strong class="text-white">20022002</strong></span>
          </div>

          <div class="pt-2 flex items-center space-x-2">
            <button
              type="button"
              id="btn-close-modal-alt"
              class="w-1/2 py-3 bg-white/5 text-zinc-300 hover:bg-white/10 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="w-1/2 py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>Confirmar</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  `;
}
function renderNewClientModal() {
    return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="bg-[#09090b] border border-white/10 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl transition-all">
        
        <!-- Header -->
        <div class="relative bg-white/[0.02] p-4 sm:p-6 border-b border-white/10">
          <button
            id="btn-close-modal"
            class="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10"
          >
            ✕
          </button>
          <h2 class="text-lg font-extrabold text-white">Cadastrar Novo Cliente</h2>
          <p class="text-xs text-zinc-400 mt-0.5">Insira os dados do cliente para ingressar no programa.</p>
        </div>

        <!-- Form -->
        <form id="form-new-client" class="p-6 space-y-4">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Nome Completo <span class="text-amber-400">*</span>
            </label>
            <input
              type="text"
              name="nome"
              required
              placeholder="Ex: Carlos Eduardo Lima"
              class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-sm text-white placeholder-zinc-500 font-sans"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              WhatsApp / Celular <span class="text-amber-400">*</span>
            </label>
            <input
              type="text"
              name="telefone"
              required
              placeholder="Ex: (11) 98765-4321"
              class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-sm text-white placeholder-zinc-500 font-mono"
            />
            <span class="text-[10px] text-zinc-500 font-mono">Usado para validação por SMS nos resgates.</span>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              CPF (Opcional)
            </label>
            <input
              type="text"
              name="cpf"
              placeholder="Ex: 000.000.000-00"
              class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-sm text-white placeholder-zinc-500 font-mono"
            />
          </div>

          <div class="pt-2 flex items-center space-x-2">
            <button
              type="button"
              id="btn-close-modal-alt"
              class="w-1/2 py-3 bg-white/5 text-zinc-300 hover:bg-white/10 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="w-1/2 py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer"
            >
              Cadastrar
            </button>
          </div>
        </form>

      </div>
    </div>
  `;
}
function renderAddPointsModal() {
    const client = store.clients.find(c => c.id === store.modalClientId);
    if (!client)
        return '';
    const currentUser = store.currentUser;
    const remainingQuota = store.getRemainingQuotaForUser(currentUser.id);
    return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="bg-[#09090b] border border-white/10 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl transition-all">
        
        <!-- Header -->
        <div class="relative bg-white/[0.02] p-4 sm:p-6 border-b border-white/10">
          <button
            id="btn-close-modal"
            class="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10"
          >
            ✕
          </button>
          <div class="flex items-center space-x-2">
            <span class="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-white">
              Nova Compra
            </span>
          </div>
          <h2 class="text-xl font-extrabold text-white mt-1">Lançar Pontos de Fidelidade</h2>
          <p class="text-xs text-zinc-400">Cliente: <strong class="text-white">${client.nome}</strong> (${client.telefone})</p>
        </div>

        <!-- Quota Banner -->
        <div class="px-6 pt-4">
          <div class="bg-black/40 border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs font-mono">
            <span class="text-zinc-400">Operador: <strong class="text-white">${currentUser.nome}</strong></span>
            <span class="text-amber-400 font-bold">Cota Restante Hoje: ${remainingQuota} pts</span>
          </div>
        </div>

        <!-- Form -->
        <form id="form-add-points" class="p-6 space-y-4">
          <input type="hidden" name="clientId" value="${client.id}" />

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Número da Comanda / Pedido <span class="text-amber-400">*</span>
            </label>
            <input
              type="text"
              name="numeroComanda"
              required
              placeholder="Ex: CMD-4920"
              class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-sm text-white placeholder-zinc-500 font-mono uppercase font-bold"
            />
            <span class="text-[10px] text-zinc-500 font-mono">Obrigatório para controle de auditoria e comanda.</span>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Valor da Compra (R$) <span class="text-amber-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              name="valorCompra"
              id="input-valor-compra"
              required
              placeholder="0.00"
              class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-lg text-emerald-400 font-mono font-bold placeholder-zinc-600"
            />
          </div>

          <!-- Points preview box -->
          <div class="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-1">
            <div class="flex justify-between items-center text-xs text-zinc-400 font-mono">
              <span>Taxa de Conversão:</span>
              <span class="text-white">R$ 1,00 = ${store.config.taxaConversaoReais} ponto</span>
            </div>
            <div class="flex justify-between items-center text-sm pt-1 border-t border-white/10">
              <span class="font-bold text-zinc-300">Pontos a Creditar:</span>
              <span id="preview-points-calculated" class="text-xl font-black text-amber-400 font-mono">+0 pts</span>
            </div>
          </div>

          <div class="pt-2 flex items-center space-x-2">
            <button
              type="button"
              id="btn-close-modal-alt"
              class="w-1/2 py-3 bg-white/5 text-zinc-300 hover:bg-white/10 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="w-1/2 py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer"
            >
              Confirmar Lançamento
            </button>
          </div>
        </form>

      </div>
    </div>
  `;
}
function renderRedemptionModal() {
    const client = store.clients.find(c => c.id === store.modalClientId);
    if (!client)
        return '';
    const rewardThreshold = store.config.valorResgatePontos;
    const rewardValueR$ = store.config.valorResgateReais;
    const canRedeem = client.saldoPontos >= rewardThreshold;
    return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="bg-[#09090b] border border-white/10 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl transition-all">
        
        <!-- Header -->
        <div class="relative bg-white/[0.02] p-4 sm:p-6 border-b border-white/10">
          <button
            id="btn-close-modal"
            class="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10"
          >
            ✕
          </button>
          <div class="flex items-center space-x-2">
            <span class="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 font-bold">
              Validação SMS
            </span>
          </div>
          <h2 class="text-xl font-extrabold text-white mt-1">Resgate de Desconto</h2>
          <p class="text-xs text-zinc-400">Cliente: <strong class="text-white">${client.nome}</strong> (${client.telefone})</p>
        </div>

        <div class="p-6 space-y-5">
          <!-- Points summary box -->
          <div class="bg-black/40 border border-white/10 p-4 rounded-2xl flex items-center justify-between font-mono">
            <div>
              <div class="text-[10px] text-zinc-400 uppercase font-bold">Saldo Disponível</div>
              <div class="text-2xl font-black text-amber-400">${client.saldoPontos} pts</div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-zinc-400 uppercase font-bold">Valor do Desconto</div>
              <div class="text-lg font-bold text-emerald-400">R$ ${rewardValueR$.toFixed(2)} OFF</div>
            </div>
          </div>

          ${!canRedeem ? `
            <div class="bg-red-950/40 border border-red-500/30 p-4 rounded-2xl text-xs text-red-200 space-y-1">
              <div class="font-bold">Saldo Insuficiente</div>
              <p>O cliente precisa de no mínimo ${rewardThreshold} pontos para resgatar R$ ${rewardValueR$.toFixed(2)} de desconto.</p>
            </div>
          ` : `
            <!-- Step 1: Request SMS button if no pending redemption -->
            <div id="redemption-step-container" class="space-y-4">
              <div class="p-4 bg-white/[0.02] border border-white/10 rounded-2xl text-xs text-zinc-300 space-y-2 font-sans">
                <p>Ao solicitar o resgate, um <strong>código de verificação de 6 dígitos</strong> será enviado via SMS para o WhatsApp do cliente.</p>
                <p class="text-[11px] text-zinc-500 font-mono">Validade do código: ${store.config.expiracaoCodigoMinutos} minutos.</p>
              </div>

              <button
                id="btn-generate-sms-code"
                data-client-id="${client.id}"
                class="w-full py-3.5 bg-white text-black hover:bg-zinc-200 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Enviar Código por SMS</span>
              </button>

              <!-- Dynamic Code Verification Form container populated dynamically upon send -->
              <div id="sms-verification-box" class="hidden space-y-4 pt-2 border-t border-white/10">
                <div class="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-200 flex items-center space-x-2">
                  <span>✓ Código SMS enviado! Verifique o Simulador de SMS ou o telefone do cliente.</span>
                </div>

                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Digite o Código SMS de 6 dígitos:
                  </label>
                  <input
                    type="text"
                    id="input-sms-code-entered"
                    maxlength="6"
                    placeholder="000000"
                    class="w-full p-3 bg-white/[0.04] border border-white/20 focus:border-white/40 rounded-xl text-center text-2xl font-mono font-black text-amber-400 tracking-widest"
                  />
                </div>

                <button
                  id="btn-confirm-sms-code"
                  class="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer"
                >
                  Confirmar e Aplicar Desconto
                </button>
              </div>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}
function renderClientDetailsModal() {
    const client = store.clients.find(c => c.id === store.modalClientId);
    if (!client)
        return '';
    const txs = store.transactions.filter(t => t.clienteId === client.id);
    const rds = store.redemptions.filter(r => r.clienteId === client.id);
    return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="bg-[#09090b] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl transition-all">
        
        <!-- Header -->
        <div class="relative bg-white/[0.02] p-4 sm:p-6 border-b border-white/10">
          <button
            id="btn-close-modal"
            class="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10"
          >
            ✕
          </button>

          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4 pr-8 sm:pr-0">
            <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-inner shrink-0">
              ${client.nome.charAt(0)}
            </div>

            <div>
              <div class="flex items-center space-x-2 flex-wrap gap-1">
                <h2 class="text-lg sm:text-xl font-extrabold text-white font-sans">${client.nome}</h2>
                <span class="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                  ${client.nivel}
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-zinc-400 mt-1.5 font-mono">
                <span>WhatsApp: ${client.telefone}</span>
                ${client.cpf ? `<span>CPF: ${client.cpf}</span>` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 sm:p-6 space-y-6">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <span class="text-[10px] text-zinc-400 uppercase">Saldo Pontos</span>
              <div class="text-lg font-black text-amber-400">${client.saldoPontos} pts</div>
            </div>
            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <span class="text-[10px] text-zinc-400 uppercase">Total Acumulado</span>
              <div class="text-lg font-black text-white">${client.totalPontosAcumulados} pts</div>
            </div>
            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <span class="text-[10px] text-zinc-400 uppercase">Total Resgatado</span>
              <div class="text-lg font-black text-red-400">${client.totalResgates} pts</div>
            </div>
            <div class="bg-black/40 p-3 rounded-xl border border-white/10">
              <span class="text-[10px] text-zinc-400 uppercase">Volume em Compras</span>
              <div class="text-lg font-black text-emerald-400">R$ ${client.totalGastoHistorico.toFixed(2)}</div>
            </div>
          </div>

          <!-- Subtabs for history -->
          <div class="space-y-3">
            <div class="flex items-center space-x-2 border-b border-white/10 pb-2">
              <button
                id="btn-client-tab-tx"
                class="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${store.clientDetailsTab === 'lancamentos' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}"
              >
                Lançamentos (${txs.length})
              </button>
              <button
                id="btn-client-tab-rd"
                class="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${store.clientDetailsTab === 'resgates' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}"
              >
                Resgates (${rds.length})
              </button>
            </div>

            ${store.clientDetailsTab === 'lancamentos' ? `
              <div class="space-y-2">
                ${txs.length === 0 ? `
                  <p class="text-xs text-zinc-500 font-mono italic">Nenhum lançamento efetuado.</p>
                ` : txs.map(t => `
                  <div class="bg-white/[0.02] border border-white/10 p-3.5 rounded-xl flex items-center justify-between text-xs font-mono">
                    <div>
                      <div class="font-bold text-white flex items-center space-x-2">
                        <span class="text-amber-400">${t.numeroComanda}</span>
                        <span class="text-zinc-600">•</span>
                        <span>R$ ${t.valorCompra.toFixed(2)}</span>
                      </div>
                      <div class="text-[10px] text-zinc-400 mt-0.5">
                        Op: ${t.usuarioNome} em ${new Date(t.dataHora).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <div class="text-right">
                      <span class="font-bold ${t.status === 'aprovado' ? 'text-emerald-400' : t.status === 'pendente' ? 'text-amber-400' : 'text-red-400'}">
                        +${t.pontosGerados} pts
                      </span>
                      <div class="text-[9px] uppercase font-bold text-zinc-400">${t.status}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="space-y-2">
                ${rds.length === 0 ? `
                  <p class="text-xs text-zinc-500 font-mono italic">Nenhum resgate efetuado.</p>
                ` : rds.map(r => `
                  <div class="bg-white/[0.02] border border-white/10 p-3.5 rounded-xl flex items-center justify-between text-xs font-mono">
                    <div>
                      <div class="font-bold text-emerald-400">Desconto R$ ${r.valorDescontoReais.toFixed(2)}</div>
                      <div class="text-[10px] text-zinc-400 mt-0.5">
                        SMS: ${r.codigoConfirmacao} • Op: ${r.usuarioNome} em ${new Date(r.dataHora).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <div class="text-right">
                      <span class="font-bold text-red-400">-${r.pontosUtilizados} pts</span>
                      <div class="text-[9px] uppercase font-bold text-zinc-400">${r.status}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

      </div>
    </div>
  `;
}
function renderRejectTxModal() {
    return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#09090b] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
        <h3 class="text-base font-extrabold text-white">Motivo da Rejeição</h3>
        <textarea
          id="textarea-reject-reason"
          placeholder="Digite a justificativa da rejeição..."
          class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-xs text-white h-24 font-mono"
          required
        ></textarea>
        <div class="flex items-center space-x-2">
          <button
            type="button"
            id="btn-close-modal"
            class="w-1/2 py-2 bg-white/5 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider border border-white/10 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-confirm-reject-tx"
            class="w-1/2 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  `;
}
function renderEstornoTxModal() {
    return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#09090b] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
        <h3 class="text-base font-extrabold text-white">Confirmar Estorno de Lançamento</h3>
        <p class="text-xs text-zinc-400">
          O estorno reverterá os pontos do cliente e gravará esta ação no log de auditoria.
        </p>
        <textarea
          id="textarea-estorno-reason"
          placeholder="Digite a justificativa obrigatória do estorno..."
          class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-xs text-white h-24 font-mono"
          required
        ></textarea>
        <div class="flex items-center space-x-2">
          <button
            type="button"
            id="btn-close-modal"
            class="w-1/2 py-2 bg-white/5 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider border border-white/10 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-confirm-estorno-tx"
            class="w-1/2 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg"
          >
            Estornar
          </button>
        </div>
      </div>
    </div>
  `;
}
function renderEstornoRdModal() {
    return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#09090b] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
        <h3 class="text-base font-extrabold text-white">Confirmar Estorno de Resgate</h3>
        <p class="text-xs text-zinc-400">
          O estorno devolverá os pontos ao saldo do cliente e gravará esta ação na auditoria.
        </p>
        <textarea
          id="textarea-estorno-reason"
          placeholder="Digite a justificativa obrigatória do estorno..."
          class="w-full p-3 bg-white/[0.04] border border-white/10 focus:border-white/30 rounded-xl text-xs text-white h-24 font-mono"
          required
        ></textarea>
        <div class="flex items-center space-x-2">
          <button
            type="button"
            id="btn-close-modal"
            class="w-1/2 py-2 bg-white/5 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider border border-white/10 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-confirm-estorno-rd"
            class="w-1/2 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg"
          >
            Estornar
          </button>
        </div>
      </div>
    </div>
  `;
}
function renderUserModal() {
    const editingUser = store.editingUserId ? store.users.find(u => u.id === store.editingUserId) : null;
    return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#09090b] border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-extrabold text-white">${editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <p class="text-xs text-zinc-400">Gerencie atendentes, gerentes e suas cotas de pontos.</p>
          </div>
          <button id="btn-close-modal" class="text-zinc-300 hover:text-white">✕</button>
        </div>

        <form id="form-user-modal" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Nome do Usuário</label>
            <input
              type="text"
              name="nome"
              value="${editingUser ? editingUser.nome : ''}"
              required
              class="w-full p-3 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Login</label>
            <input
              type="text"
              name="login"
              value="${editingUser ? editingUser.login : ''}"
              required
              class="w-full p-3 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Perfil</label>
              <select name="perfil" class="w-full p-3 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white">
                <option value="atendente" ${editingUser?.perfil === 'atendente' ? 'selected' : ''}>Atendente</option>
                <option value="gerente" ${editingUser?.perfil === 'gerente' ? 'selected' : ''}>Gerente</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cota Diária</label>
              <input
                type="number"
                name="cotaDiaria"
                min="0"
                value="${editingUser ? editingUser.cotaDiariaPontos : 500}"
                class="w-full p-3 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" id="btn-close-modal-alt" class="flex-1 py-3 bg-white/5 text-zinc-300 hover:bg-white/10 rounded-xl text-xs uppercase tracking-wider">Cancelar</button>
            <button type="submit" class="flex-1 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs uppercase tracking-wider font-bold">Salvar Usuário</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
function renderCouponModal() {
    const editingCoupon = store.editingCouponId ? store.coupons.find(c => c.id === store.editingCouponId) : null;
    return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#09090b] border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-extrabold text-white">${editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</h3>
            <p class="text-xs text-zinc-400">Configure ofertas e pontos necessários para resgate.</p>
          </div>
          <button id="btn-close-modal" class="text-zinc-300 hover:text-white">✕</button>
        </div>

        <form id="form-coupon-modal" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Título</label>
            <input
              type="text"
              name="titulo"
              value="${editingCoupon ? editingCoupon.titulo : ''}"
              required
              class="w-full p-3 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Descrição</label>
            <textarea
              name="descricao"
              required
              class="w-full p-3 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 h-24 resize-none"
            >${editingCoupon ? editingCoupon.descricao : ''}</textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pontos Necessários</label>
              <input
                type="number"
                name="pontosNecessarios"
                min="1"
                value="${editingCoupon ? editingCoupon.pontosNecessarios : 100}"
                required
                class="w-full p-3 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Valor do Desconto</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="valorDescontoReais"
                value="${editingCoupon ? editingCoupon.valorDescontoReais.toFixed(2) : '10.00'}"
                required
                class="w-full p-3 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <label class="inline-flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" name="ativo" ${editingCoupon?.ativo ? 'checked' : ''} class="h-4 w-4 rounded border-white/10 bg-white/5" />
              <span class="text-xs uppercase tracking-wider">Ativo</span>
            </label>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" id="btn-close-modal-alt" class="flex-1 py-3 bg-white/5 text-zinc-300 hover:bg-white/10 rounded-xl text-xs uppercase tracking-wider">Cancelar</button>
            <button type="submit" class="flex-1 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs uppercase tracking-wider font-bold">Salvar Cupom</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
