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
      <section class="service-toolbar border p-4 sm:p-6">
        <div class="service-toolbar-heading flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="service-copy">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-3">
              <span class="w-2 h-2 rounded-full bg-blue-400"></span>
              <span class="text-xs font-semibold text-zinc-300">Atendimento</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Encontre o cliente
            </h1>
            <p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Busque por nome, celular ou CPF para lançar pontos e resgatar benefícios.
            </p>
          </div>

          <button
            id="btn-open-new-client"
            class="button-primary self-start sm:self-auto px-5 font-bold text-sm flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            <span>Cadastrar Cliente</span>
          </button>
        </div>

        <!-- Search Input Box -->
        <div class="service-search mt-6 relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <label for="input-client-search" class="sr-only">Buscar cliente por nome, celular ou CPF</label>
          <input
            type="text"
            id="input-client-search"
            value="${store.searchQuery}"
            placeholder="Nome, celular ou CPF"
            autocomplete="off"
            class="control-field w-full pl-11 pr-4 text-sm text-white placeholder-zinc-500"
          />
        </div>
      </section>

      <!-- Results Title -->
      <div class="mobile-result-summary flex items-center justify-between gap-2 text-xs text-zinc-400 font-mono px-1">
        <span>EXIBINDO <strong>${filteredClients.length}</strong> CLIENTE(S) CADASTRADOS</span>
        <span>REGRA DE RESGATE: <strong>${rewardThreshold} PTS = R$ ${store.config.valorResgateReais.toFixed(2)} OFF</strong></span>
      </div>

      <!-- Clients Cards Grid -->
      ${filteredClients.length === 0 ? `
        <div class="empty-state">
          <svg class="w-10 h-10 text-zinc-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <h3 class="text-base font-bold text-white">Nenhum cliente encontrado</h3>
          <p class="text-xs text-zinc-400 max-w-sm mx-auto">
            Não encontramos nenhum cliente cadastrado com o termo "${store.searchQuery}". Clique no botão abaixo para cadastrá-lo.
          </p>
          <button
            id="btn-open-new-client-empty"
            class="button-primary mt-2 px-4 font-bold text-xs cursor-pointer inline-flex items-center space-x-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Cadastrar "${store.searchQuery}"</span>
          </button>
        </div>
      ` : `
        <div class="client-grid">
          ${filteredClients.map(client => renderClientCard(client, rewardThreshold)).join('')}
        </div>
      `}

    </div>
  `;
}
function renderClientCard(client, rewardThreshold) {
    const progressPercent = Math.min(100, Math.round((client.saldoPontos / rewardThreshold) * 100));
    const canRedeem = client.saldoPontos >= rewardThreshold;
    const pointsUntilReward = Math.max(0, rewardThreshold - client.saldoPontos);
    const levelKey = String(client.nivel || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
    return `
    <article class="client-card motion-control group" data-client-card data-client-id="${client.id}">
      <div>
        <!-- Top Header -->
        <div class="client-card-header flex items-start justify-between">
          <div class="client-identity flex items-center space-x-3">
            <div class="client-avatar">
              ${client.nome.charAt(0)}
            </div>
            <div class="min-w-0">
              <h3 class="client-name font-extrabold text-white text-sm font-sans leading-tight">
                ${client.nome}
              </h3>
            </div>
          </div>

          <div class="client-meta flex items-center space-x-1.5 shrink-0">
            <button
              data-action="open-edit-client"
              data-client-id="${client.id}"
              aria-label="Editar dados de ${client.nome}"
              class="client-edit-button motion-control cursor-pointer"
              title="Editar dados do cliente"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <span class="client-level" data-level="${levelKey}">
              ${client.nivel}
            </span>
          </div>
        </div>

        <!-- Points Display -->
        <div class="client-points">
          <div class="client-balance">
            <span class="client-balance-label">Saldo atual</span>
            <span class="client-balance-value">${client.saldoPontos} <small>pts</small></span>
          </div>

          <!-- Progress towards reward -->
          <div class="client-reward-progress">
            <div class="client-progress-copy">
              <span>${canRedeem ? 'Resgate disponível' : `${pointsUntilReward} pts para resgatar`}</span>
              <span>${progressPercent}%</span>
            </div>
            <progress class="secure-progress secure-progress-compact w-full" max="100" value="${progressPercent}" aria-label="${progressPercent}% do objetivo de ${rewardThreshold} pontos"></progress>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="client-card-footer">
        <div class="client-card-actions grid grid-cols-2 gap-2">
          <button
            data-action="add-points"
            data-client-id="${client.id}"
            aria-label="Lançar pontos para ${client.nome}"
            class="button-primary px-3 font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>+ Pontos</span>
          </button>

          <button
            data-action="redeem"
            data-client-id="${client.id}"
            aria-label="Resgatar benefício para ${client.nome}"
            class="button-secondary text-xs motion-control flex items-center justify-center space-x-1 cursor-pointer ${canRedeem
        ? 'client-redeem-ready'
        : 'text-zinc-400'}"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4.5M12 8H7.5M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/></svg>
            <span>Resgatar</span>
          </button>
        </div>

        <button
          data-action="details"
          data-client-id="${client.id}"
          aria-label="Ver histórico de ${client.nome}"
          class="client-history-button motion-control cursor-pointer"
        >
          <span>Ver histórico</span>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </article>
  `;
}
