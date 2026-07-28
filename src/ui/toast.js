import { store } from '../store';
export function renderToast() {
    const toast = store.toast;
    if (!toast)
        return '';
    const isSuccess = toast.type === 'success';
    const isError = toast.type === 'error';
    return `
    <div class="fixed bottom-6 right-6 z-50 flex items-center space-x-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${isSuccess
        ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
        : isError
            ? 'bg-red-950/90 border-red-500/30 text-red-100'
            : 'bg-zinc-900/90 border-white/20 text-white'}">
      <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : isError ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}">
        ${isSuccess ? '✓' : isError ? '✕' : 'ℹ'}
      </div>
      <div class="text-xs font-semibold font-sans tracking-wide">
        ${toast.message}
      </div>
    </div>
  `;
}
