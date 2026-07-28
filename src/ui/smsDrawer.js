import { store } from '../store';
export function renderSmsDrawer() {
    if (!store.isSmsDrawerOpen)
        return '';
    const smsLogs = store.smsLogs;
    return `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
      <div class="w-full max-w-md bg-[#09090b] border-l border-white/10 h-full flex flex-col shadow-2xl animate-slide-in-right">
        
        <!-- Phone Header -->
        <div class="bg-black/60 p-4 border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-white/10 border border-white/20 text-amber-400 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-sm font-extrabold text-white">Simulador de SMS</h2>
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p class="text-[10px] text-zinc-400 font-mono">Gateway de envio de mensagens curtas</p>
            </div>
          </div>

          <div class="flex items-center space-x-1">
            <button
              id="btn-mark-all-sms-read"
              class="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg text-xs cursor-pointer"
              title="Marcar todas como lidas"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </button>
            <button
              id="btn-close-sms-drawer"
              class="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg text-xs cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- SMS List Container -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-black/40 font-sans">
          
          <div class="text-center py-2">
            <span class="text-[9px] uppercase font-bold tracking-widest bg-white/5 text-zinc-400 px-3 py-1 rounded-full border border-white/10">
              Disparos Recentes
            </span>
          </div>

          ${smsLogs.length === 0 ? `
            <div class="text-center py-16 space-y-2 text-zinc-600">
              <svg class="w-8 h-8 mx-auto text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              <p class="text-xs font-mono">Nenhum SMS disparado ainda.</p>
            </div>
          ` : smsLogs.map(sms => `
            <div
              data-sms-id="${sms.id}"
              class="p-4 rounded-2xl border transition-all space-y-2 ${sms.lida
        ? 'bg-black/60 border-white/10 opacity-80'
        : 'bg-white/[0.03] border-white/30 shadow-lg ring-1 ring-white/20'}"
            >
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-amber-400 flex items-center space-x-1">
                  <span>${sms.clienteNome}</span>
                  <span class="text-zinc-500 font-mono text-[11px]">(${sms.telefoneDestino})</span>
                </span>
                <span class="text-[10px] text-zinc-500 font-mono">
                  ${new Date(sms.dataHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div class="bg-black/60 p-3 rounded-xl border border-white/10 text-xs text-zinc-200 leading-relaxed font-sans">
                ${sms.mensagem}
              </div>

              ${sms.codigoRef ? `
                <div class="pt-1 flex items-center justify-between text-[11px]">
                  <span class="text-zinc-400 flex items-center space-x-1 font-mono">
                    <span>Código: <strong class="text-amber-400 text-xs">${sms.codigoRef}</strong></span>
                  </span>

                  <button
                    data-copy-code="${sms.codigoRef}"
                    class="bg-white hover:bg-zinc-200 text-black font-extrabold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Copiar</span>
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}

        </div>

        <!-- Footer info -->
        <div class="p-3 bg-black/80 border-t border-white/10 text-center text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
          Simulador de Gateway SMS • Ambiente Local
        </div>

      </div>
    </div>
  `;
}
