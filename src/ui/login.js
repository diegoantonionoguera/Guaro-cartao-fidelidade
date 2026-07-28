import { store } from '../store';
export function renderLoginView() {
    return `
    <div class="min-h-[80vh] flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-[#2E2E2E]/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6">
        
        <!-- Top decorative badge -->
        <div class="text-center space-y-3">
          <div class="brand-mark inline-flex items-center justify-center w-14 h-14 rounded-2xl font-black text-2xl">
            F
          </div>
          <div>
            <h1 class="text-xl font-black text-white tracking-tight font-sans">
              El Buen Venezolano Guaro
            </h1>
            <p class="text-xs text-zinc-400 mt-1 font-mono">Sistema de fidelidade e recompensas</p>
          </div>
        </div>

        <!-- Credentials Form -->
        <form id="form-login" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
              Login / Usuário
            </label>
            <div class="relative">
              <input
                type="text"
                id="input-login-username"
                name="login"
                placeholder="Informe seu usuário"
                class="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-mono focus:outline-none focus:border-white/30 transition-all"
                value=""
                required
                autofocus
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
              Senha
            </label>
            <div class="relative">
              <input
                type="password"
                id="input-login-password"
                name="senha"
                placeholder="••••••••"
                class="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-mono focus:outline-none focus:border-white/30 transition-all"
                value=""
                required
              />
            </div>
          </div>

          <!-- Error Alert if any -->
          ${store.loginError ? `
            <div class="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center space-x-2.5 animate-shake">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>${store.loginError}</span>
            </div>
          ` : ''}

          <button
            type="submit"
            id="btn-login-submit"
            class="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99]"
          >
            <span>Entrar no Sistema</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </form>

        <p class="text-center text-[11px] text-zinc-500 font-mono">
          Acesso protegido. As credenciais nunca são armazenadas no navegador.
        </p>

      </div>
    </div>
  `;
}
