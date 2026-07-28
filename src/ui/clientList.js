import { store } from '../store';
export function renderClientList() {
    const q = store.searchQuery.toLowerCase().trim();
    const rewardThreshold = store.config.valorResgatePontos;
    const filteredClients = store.clients.filter(c => {
        if (!q)
            return true;
        return (c.nome.toLowerCase().includes(q) ||
            c.telefone.includes(q) ||
            (c.cpf && c.cpf.includes(q)));
    });
    return `
    <div class="space-y-6">
      
      <!-- Search Header Banner -->
      <div class="bg-white/[0.03] border border-white/10 p-4 sm:p-6 lg:p-8 rounded-2xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-3">
              <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span class="text-[10px] uppercase font-mono tracking-widest text-zinc-300">Terminal de Lançamento e Resgates</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Localizar Cliente
            </h1>
            <p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Digite o número de WhatsApp/Celular, Nome ou CPF do cliente para realizar comanda ou efetuar resgate.
            </p>
          </div>

          <button
            id="btn-open-new-client"
            class="self-start sm:self-auto px-5 sm:px-6 py-3 sm:py-3.5 bg-white text-black font-bold text-[11px] sm:text-xs uppercase tracking-widest hover:bg-zinc-200 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer shadow-xl"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            <span>Cadastrar Cliente</span>
          </button>
        </div>

        <!-- Search Input Box -->
        <div class="mt-6 relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input
            type="text"
            id="input-client-search"
            value="${store.searchQuery}"
            placeholder="Pesquisar por Nome, WhatsApp (ex: 11 99887) ou CPF..."
            class="w-full pl-11 pr-4 py-3.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all font-sans"
          />
        </div>
      </div>

      <!-- Results Title -->
      <div class="mobile-result-summary flex items-center justify-between gap-2 text-xs text-zinc-400 font-mono px-1">
        <span>EXIBINDO <strong>${filteredClients.length}</strong> CLIENTE(S) CADASTRADOS</span>
        <span>REGRA DE RESGATE: <strong>${rewardThreshold} PTS = R$ ${store.config.valorResgateReais.toFixed(2)} OFF</strong></span>
      </div>

      <!-- Clients Cards Grid -->
      ${filteredClients.length === 0 ? `
        <div class="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <svg class="w-10 h-10 text-zinc-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <h3 class="text-base font-bold text-white">Nenhum cliente encontrado</h3>
          <p class="text-xs text-zinc-400 max-w-sm mx-auto">
            Não encontramos nenhum cliente cadastrado com o termo "${store.searchQuery}". Clique no botão abaixo para cadastrá-lo.
          </p>
          <button
            id="btn-open-new-client-empty"
            class="mt-2 px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Cadastrar "${store.searchQuery}"</span>
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filteredClients.map(client => renderClientCard(client, rewardThreshold)).join('')}
        </div>
      `}

    </div>
  `;
}
function renderClientCard(client, rewardThreshold) {
    const progressPercent = Math.min(100, Math.round((client.saldoPontos / rewardThreshold) * 100));
    const canRedeem = client.saldoPontos >= rewardThreshold;
    return `
    <div class="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl p-4 sm:p-6 transition-all shadow-xl flex flex-col justify-between group">
      <div>
        <!-- Top Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-base flex items-center justify-center shrink-0">
              ${client.nome.charAt(0)}
            </div>
            <div>
              <h3 class="font-extrabold text-white text-sm font-sans leading-tight group-hover:text-amber-400 transition-colors">
                ${client.nome}
              </h3>
              <p class="text-xs text-zinc-400">${client.telefone}</p>
              ${client.email ? `<p class="text-[11px] text-zinc-500 truncate max-w-[13rem]">${client.email}</p>` : ''}
            </div>
          </div>

          <div class="flex items-center space-x-1.5 shrink-0">
            <button
              data-action="open-edit-client"
              data-client-id="${client.id}"
              class="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-zinc-300 hover:text-white transition-all cursor-pointer border border-white/10 flex items-center justify-center"
              title="Editar dados do cliente"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <span class="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-zinc-300 border border-white/10 font-mono">
              ${client.nivel}
            </span>
          </div>
        </div>

        <!-- Points Display -->
        <div class="mt-5 p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-2">
          <div class="flex justify-between items-baseline">
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Saldo Atual</span>
            <span class="text-xl font-black text-amber-400 font-mono">${client.saldoPontos} <span class="text-xs font-normal text-zinc-400">pts</span></span>
          </div>

          <!-- Progress towards reward -->
          <div class="space-y-1">
            <div class="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>Objetivo Resgate (${rewardThreshold} pts)</span>
              <span>${progressPercent}%</span>
            </div>
            <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-amber-400 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-5 space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <button
            data-action="add-points"
            data-client-id="${client.id}"
            class="py-2.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-md"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>+ Pontos</span>
          </button>

          <button
            data-action="redeem"
            data-client-id="${client.id}"
            class="py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${canRedeem
        ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-400/20'
        : 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10'}"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4.5M12 8H7.5M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/></svg>
            <span>Resgatar</span>
          </button>
        </div>

        <button
          data-action="details"
          data-client-id="${client.id}"
          class="w-full py-1.5 text-zinc-400 hover:text-white text-[10px] font-mono uppercase tracking-wider flex items-center justify-center space-x-1 cursor-pointer"
        >
          <span>Ver histórico do cliente</span>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  `;
}
