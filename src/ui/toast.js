export function renderToast(toast) {
    if (!toast)
        return '';
    const isSuccess = toast.type === 'success';
    const isError = toast.type === 'error';
    return `
    <div
      data-toast-id="${toast.id}"
      data-state="entering"
      role="${isError ? 'alert' : 'status'}"
      aria-live="${isError ? 'assertive' : 'polite'}"
      class="toast-message flex items-center space-x-3 p-4 rounded-lg shadow-2xl border ${isSuccess
        ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
        : isError
            ? 'bg-red-950/90 border-red-500/30 text-red-100'
            : 'bg-zinc-900/90 border-white/20 text-white'}"
    >
      <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : isError ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}">
        ${isSuccess
            ? '<svg aria-hidden="true" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" d="m5 12 4 4L19 6"/></svg>'
            : isError
                ? '<svg aria-hidden="true" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" d="M6 6l12 12M18 6 6 18"/></svg>'
                : '<svg aria-hidden="true" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" d="M12 8h.01M11 12h1v4h1m8-4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>'}
      </div>
      <div class="text-xs font-semibold font-sans tracking-wide">
        ${toast.message}
      </div>
    </div>
  `;
}
