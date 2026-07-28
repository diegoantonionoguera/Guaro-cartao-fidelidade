import { store } from '../store';
import { getTheme } from '../theme';
import logoUrl from '../assets/brand/guaro-logo.png';
export function renderLoginView() {
    const currentTheme = getTheme();
    return `
    <div class="login-shell min-h-[80vh] flex items-center justify-center p-4">
      <div class="login-panel w-full max-w-md border p-6 sm:p-8 relative overflow-hidden space-y-6">
        <button
          type="button"
          class="login-theme-toggle"
          data-theme-toggle
          role="switch"
          aria-checked="${currentTheme === 'dark'}"
          aria-label="${currentTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}"
          title="${currentTheme === 'dark' ? 'Usar modo claro' : 'Usar modo escuro'}"
        >
          <span class="theme-toggle-label theme-toggle-label-dark">Escuro</span>
          <span class="theme-toggle-label theme-toggle-label-light">Claro</span>
          <span class="theme-toggle-thumb" aria-hidden="true">
            <svg class="theme-toggle-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>
            <svg class="theme-toggle-moon" viewBox="0 0 24 24"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/></svg>
          </span>
        </button>
        
        <!-- Top decorative badge -->
        <div class="text-center space-y-3">
          <img src="${logoUrl}" alt="Guaro El Buen Venezolano" class="login-logo mx-auto" />
          <div>
            <h1 class="text-xl font-black text-white tracking-tight font-sans">
              Guaro El Buen Venezolano
            </h1>
            <p class="text-sm text-zinc-400 mt-1">Clientes, pontos e recompensas</p>
          </div>
        </div>

        <!-- Credentials Form -->
        <form id="form-login" class="space-y-4">
          <div class="space-y-1.5">
            <label for="input-login-username" class="text-xs font-bold text-zinc-300 block">
              Usuário
            </label>
            <div class="relative">
              <input
                type="text"
                id="input-login-username"
                name="login"
                placeholder="Informe seu usuário"
                class="control-field w-full px-4 text-white text-sm"
                value=""
                required
                autofocus
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="input-login-password" class="text-xs font-bold text-zinc-300 block">
              Senha
            </label>
            <div class="relative">
              <input
                type="password"
                id="input-login-password"
                name="senha"
                placeholder="Sua senha"
                class="control-field w-full px-4 text-white text-sm"
                value=""
                required
              />
            </div>
          </div>

          <!-- Error Alert if any -->
          ${store.loginError ? `
            <div class="p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center space-x-2.5 animate-shake">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>${store.loginError}</span>
            </div>
          ` : ''}

          <button
            type="submit"
            id="btn-login-submit"
            class="button-primary w-full px-5 font-extrabold text-sm cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>Entrar no painel</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </form>

        <p class="text-center text-xs text-zinc-500">
          Acesso exclusivo para a equipe Guaro.
        </p>

      </div>
    </div>
  `;
}
