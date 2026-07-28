import { store } from '../store';
export function renderNavbar() {
    const currentUser = store.currentUser;
    const unreadSms = store.smsLogs.filter(s => !s.lida).length;
    const pendingTxs = store.transactions.filter(t => t.status === 'pendente').length;
    const remainingQuota = store.getRemainingQuotaForUser(currentUser.id);
    const totalLancadosHoje = store.getPontosLancadosHoje(currentUser.id);
    return `
    <header class="bg-[#161616]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div class="mobile-nav-layout flex items-center justify-between min-h-16 sm:h-20 gap-2 py-2 sm:py-0">
          
          <!-- Logo -->
          <div class="mobile-brand flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div class="brand-mark w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-lg">
              F
            </div>
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <span class="block max-w-[11rem] sm:max-w-none truncate text-sm sm:text-base font-black text-white tracking-tight font-sans">
                  ${store.config.nomeEstabelecimento}
                </span>
                <span class="hidden sm:inline-block text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                  Fidelidade
                </span>
              </div>
              <p class="text-[10px] text-zinc-400 font-mono hidden sm:block">Fidelização e Recompensas Instantâneas</p>
            </div>
          </div>

          <!-- Navigation Tabs (Desktop & Mobile) -->
          <nav aria-label="Navegação principal" class="mobile-primary-nav flex items-center space-x-1 sm:space-x-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/10">
            <button
              id="btn-nav-dashboard"
              class="px-2.5 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center space-x-1 sm:space-x-1.5 cursor-pointer ${store.activeTab === 'dashboard'
        ? 'bg-white text-black shadow-sm'
        : 'text-zinc-400 hover:text-white hover:bg-white/5'}"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              <span>Atendimento</span>
            </button>

            <button
              id="btn-nav-manager"
              class="px-2.5 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center space-x-1 sm:space-x-1.5 relative cursor-pointer ${store.activeTab === 'manager'
        ? 'bg-white text-black shadow-sm'
        : 'text-zinc-400 hover:text-white hover:bg-white/5'}"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span>Gerência</span>
              ${pendingTxs > 0 ? `
                <span class="w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center animate-pulse">
                  ${pendingTxs}
                </span>
              ` : ''}
            </button>
          </nav>

          <!-- Right Controls -->
          <div class="mobile-nav-actions flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            
            <!-- Cota Indicator Button -->
            <div class="relative">
              <button
                id="btn-quota-toggle"
                class="px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 font-mono transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span class="hidden sm:inline text-zinc-400 text-[11px]">Cota Hoje:</span>
                <strong class="quota-value ${remainingQuota < 100 ? 'text-amber-400 font-bold' : 'text-white'}">
                  ${remainingQuota} pts
                </strong>
              </button>

              <!-- Quota Info Dropdown Tooltip -->
              ${store.showQuotaTooltip ? `
                <div class="absolute right-0 mt-2 w-[85vw] max-w-xs bg-[#2E2E2E] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-xs backdrop-blur-xl">
                  <div class="flex items-center justify-between pb-2 border-b border-white/10">
                    <span class="font-bold uppercase tracking-wider text-zinc-200">Controle de Cota Diária</span>
                    <span class="text-[9px] uppercase tracking-widest bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                      ${currentUser.perfil}
                    </span>
                  </div>
                  <div class="py-3 space-y-2 font-mono">
                    <div class="flex justify-between text-zinc-400">
                      <span>Lançados Hoje:</span>
                      <span class="text-white font-bold">${totalLancadosHoje} pts</span>
                    </div>
                    <div class="flex justify-between text-zinc-400">
                      <span>Cota Total Permitida:</span>
                      <span class="text-white font-bold">${currentUser.cotaDiariaPontos} pts</span>
                    </div>
                    <div class="flex justify-between pt-2 border-t border-white/10 text-amber-400 font-bold">
                      <span>Saldo Disponível:</span>
                      <span>${remainingQuota} pts</span>
                    </div>
                  </div>
                  <p class="text-[10px] text-zinc-500 italic border-t border-white/10 pt-2 font-sans">
                    Lançamentos acima da cota restante exigirão aprovação prévia do gerente.
                  </p>
                </div>
              ` : ''}
            </div>

            <!-- User Select Profile Dropdown -->
            <div class="relative">
              <select
                id="select-user-profile"
                class="mobile-profile-select bg-white/5 border border-white/10 text-white text-xs font-medium rounded-xl px-2.5 sm:px-3 py-1.5 focus:outline-none focus:border-white/30 font-sans cursor-pointer"
              >
                ${store.users.map(u => `
                  <option value="${u.id}" ${u.id === currentUser.id ? 'selected' : ''} class="bg-zinc-900 text-white">
                    ${u.nome} (${u.perfil === 'gerente' ? 'Gerente' : 'Atendente'})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- SMS Simulator Drawer Toggle Button -->
            <button
              id="btn-sms-drawer-toggle"
              class="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Abrir Simulador de SMS (Twilio)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              ${unreadSms > 0 ? `
                <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 text-black text-[9px] font-black flex items-center justify-center animate-pulse">
                  ${unreadSms}
                </span>
              ` : ''}
            </button>

            <!-- Logout Button -->
            <button
              id="btn-logout"
              class="px-2.5 sm:px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
              title="Sair do sistema"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              <span class="hidden sm:inline">Sair</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  `;
}
