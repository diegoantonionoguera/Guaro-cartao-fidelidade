import { store } from './store';
import { renderNavbar } from './ui/navbar';
import { renderClientList } from './ui/clientList';
import { renderManagerPanel } from './ui/managerPanel';
import { renderModals } from './ui/modals';
import { renderSmsDrawer } from './ui/smsDrawer';
import { renderToast } from './ui/toast';
import { renderLoginView } from './ui/login';
let currentPendingRedemption = null;
let redemptionTimerId = null;
function startRedemptionTimer(redemption) {
    if (redemptionTimerId)
        clearInterval(redemptionTimerId);
    const update = () => {
        const timer = document.getElementById('redemption-entry-timer');
        const status = document.getElementById('redemption-code-status');
        const resend = document.getElementById('btn-resend-email-code');
        if (!timer)
            return;
        const entryRemaining = Math.max(0, new Date(redemption.entryWindowEndsAt).getTime() - Date.now());
        const codeRemaining = Math.max(0, new Date(redemption.expiresAt).getTime() - Date.now());
        const seconds = Math.ceil(entryRemaining / 1000);
        timer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
        if (codeRemaining <= 0 && status) {
            status.textContent = entryRemaining > 0
                ? 'Código expirado. Solicite um novo código.'
                : 'Tempo de preenchimento encerrado.';
            status.className = 'text-[11px] font-semibold text-red-300';
            if (resend && entryRemaining > 0)
                resend.classList.remove('hidden');
        }
        if (entryRemaining <= 0)
            clearInterval(redemptionTimerId);
    };
    update();
    redemptionTimerId = setInterval(update, 1000);
}
function renderSalesVolumeChart(container) {
    const totals = new Map();
    store.transactions
        .filter(transaction => transaction.status === 'aprovado')
        .forEach(transaction => {
        const current = totals.get(transaction.usuarioNome) || 0;
        totals.set(transaction.usuarioNome, current + Number(transaction.valorCompra || 0));
    });
    const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maximum = Math.max(...rows.map(([, total]) => total), 1);
    container.innerHTML = rows.length ? `
        <div class="space-y-4">
          <h3 class="text-sm font-extrabold text-white">Volume de vendas por atendente</h3>
          <div class="space-y-3">
            ${rows.map(([name, total]) => `
              <div class="grid grid-cols-[120px_1fr_100px] items-center gap-3 text-xs">
                <span class="truncate text-zinc-300">${name}</span>
                <div class="h-3 rounded-full bg-white/10 overflow-hidden" role="img" aria-label="${name}: R$ ${total.toFixed(2)}">
                  <div class="h-full rounded-full bg-amber-400" style="width:${Math.max(3, total / maximum * 100)}%"></div>
                </div>
                <strong class="text-right text-amber-400">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
              </div>
            `).join('')}
          </div>
        </div>` : '<p class="py-8 text-center text-xs text-zinc-500">Nenhuma venda aprovada.</p>';
}
function renderApp() {
    const navbarContainer = document.getElementById('navbar-container');
    const mainContainer = document.getElementById('main-container');
    const modalsContainer = document.getElementById('modals-container');
    const smsDrawerContainer = document.getElementById('sms-drawer-container');
    const toastContainer = document.getElementById('toast-container');
    if (!store.isAuthenticated) {
        if (navbarContainer)
            navbarContainer.innerHTML = '';
        if (mainContainer)
            mainContainer.innerHTML = renderLoginView();
        if (modalsContainer)
            modalsContainer.innerHTML = '';
        if (smsDrawerContainer)
            smsDrawerContainer.innerHTML = '';
        if (toastContainer)
            toastContainer.innerHTML = renderToast();
        return;
    }
    if (navbarContainer)
        navbarContainer.innerHTML = renderNavbar();
    if (mainContainer) {
        mainContainer.innerHTML = store.activeTab === 'dashboard' ? renderClientList() : renderManagerPanel();
    }
    if (modalsContainer)
        modalsContainer.innerHTML = renderModals();
    if (smsDrawerContainer)
        smsDrawerContainer.innerHTML = renderSmsDrawer();
    if (toastContainer)
        toastContainer.innerHTML = renderToast();
    const chartMount = document.getElementById('recharts-sales-volume-mount');
    if (chartMount)
        renderSalesVolumeChart(chartMount);
}
// Initial Render and Subscribe to Store Changes
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
    store.subscribe(renderApp);
    setupEventDelegation();
});
function setupEventDelegation() {
    // Global Click Event Delegation
    document.addEventListener('click', async (e) => {
        const target = e.target;
        if (!target)
            return;
        // Logout Button
        if (target.closest('#btn-logout')) {
            store.logout();
            return;
        }
        // Nav Tabs
        if (target.closest('#btn-nav-dashboard')) {
            store.setActiveTab('dashboard');
            return;
        }
        if (target.closest('#btn-nav-manager')) {
            store.setActiveTab('manager');
            return;
        }
        if (target.closest('#btn-quota-toggle')) {
            store.toggleQuotaTooltip();
            return;
        }
        if (target.closest('#btn-sms-drawer-toggle')) {
            store.toggleSmsDrawer();
            return;
        }
        if (target.closest('#btn-close-sms-drawer')) {
            store.toggleSmsDrawer(false);
            return;
        }
        if (target.closest('#btn-mark-all-sms-read')) {
            store.markAllSmsAsRead();
            return;
        }
        // Client Actions
        if (target.closest('#btn-open-new-client') || target.closest('#btn-open-new-client-empty')) {
            store.openModal('new-client');
            return;
        }
        const editClientBtn = target.closest('[data-action="open-edit-client"]');
        if (editClientBtn) {
            const clientId = editClientBtn.dataset.clientId;
            if (clientId)
                store.openModal('edit-client', clientId);
            return;
        }
        const addUserBtn = target.closest('[data-action="add-user"]');
        if (addUserBtn) {
            store.openModal('user-modal');
            return;
        }
        const editUserBtn = target.closest('[data-action="edit-user"]');
        if (editUserBtn) {
            const userId = editUserBtn.dataset.userId;
            if (userId)
                store.openModal('user-modal', userId);
            return;
        }
        const deleteUserBtn = target.closest('[data-action="delete-user"]');
        if (deleteUserBtn) {
            const userId = deleteUserBtn.dataset.userId;
            if (userId && window.confirm('Excluir este usuário? Ele perderá o acesso ao sistema.'))
                store.deleteUser(userId);
            return;
        }
        const deleteClientBtn = target.closest('[data-action="delete-client"]');
        if (deleteClientBtn) {
            const clientId = deleteClientBtn.dataset.clientId;
            if (clientId && window.confirm('Excluir este cliente da planilha? Esta ação não pode ser desfeita.'))
                store.deleteClient(clientId);
            return;
        }
        const addCouponBtn = target.closest('[data-action="add-coupon"]');
        if (addCouponBtn) {
            store.openModal('coupon-modal');
            return;
        }
        const editCouponBtn = target.closest('[data-action="edit-coupon"]');
        if (editCouponBtn) {
            const couponId = editCouponBtn.dataset.couponId;
            if (couponId)
                store.openModal('coupon-modal', couponId);
            return;
        }
        const deleteCouponBtn = target.closest('[data-action="delete-coupon"]');
        if (deleteCouponBtn) {
            const couponId = deleteCouponBtn.dataset.couponId;
            if (couponId && window.confirm('Excluir este cupom da planilha?'))
                await store.deleteCoupon(couponId);
            return;
        }
        const toggleCouponBtn = target.closest('[data-action="toggle-coupon"]');
        if (toggleCouponBtn) {
            const couponId = toggleCouponBtn.dataset.couponId;
            if (couponId)
                await store.toggleCouponStatus(couponId);
            return;
        }
        const selectRedemptionCoupon = target.closest('[data-action="select-redemption-coupon"]');
        if (selectRedemptionCoupon && !store.pendingRedemption) {
            const couponId = selectRedemptionCoupon.dataset.couponId;
            if (couponId)
                store.selectCouponForRedemption(couponId);
            return;
        }
        const addPtsBtn = target.closest('[data-action="add-points"]');
        if (addPtsBtn) {
            const clientId = addPtsBtn.dataset.clientId;
            if (clientId)
                store.openModal('add-points', clientId);
            return;
        }
        const redeemBtn = target.closest('[data-action="redeem"]');
        if (redeemBtn) {
            const clientId = redeemBtn.dataset.clientId;
            if (clientId)
                store.openModal('redemption', clientId);
            return;
        }
        const detailsBtn = target.closest('[data-action="details"]');
        if (detailsBtn) {
            const clientId = detailsBtn.dataset.clientId;
            if (clientId)
                store.openModal('client-details', clientId);
            return;
        }
        // Manager Panel Subtabs
        const subtabBtn = target.closest('[data-manager-subtab]');
        if (subtabBtn) {
            const subtab = subtabBtn.dataset.managerSubtab;
            if (subtab)
                store.setManagerSubTab(subtab);
            return;
        }
        const approveTxBtn = target.closest('[data-action="approve-tx"]');
        if (approveTxBtn) {
            const txId = approveTxBtn.dataset.txId;
            if (txId)
                await store.approveTransaction(txId);
            return;
        }
        const rejectTxBtn = target.closest('[data-action="reject-tx"]');
        if (rejectTxBtn) {
            const txId = rejectTxBtn.dataset.txId;
            if (txId)
                store.openModal('reject-tx', txId);
            return;
        }
        const openEstornoTxBtn = target.closest('[data-action="open-estorno-tx"]');
        if (openEstornoTxBtn) {
            const txId = openEstornoTxBtn.dataset.txId;
            if (txId)
                store.openModal('estorno-tx', txId);
            return;
        }
        const openEstornoRdBtn = target.closest('[data-action="open-estorno-rd"]');
        if (openEstornoRdBtn) {
            const rdId = openEstornoRdBtn.dataset.rdId;
            if (rdId)
                store.openModal('estorno-rd', rdId);
            return;
        }
        // Modal Actions & Closes
        if (target.closest('#btn-close-modal') || target.closest('#btn-close-modal-alt')) {
            currentPendingRedemption = null;
            if (redemptionTimerId)
                clearInterval(redemptionTimerId);
            store.closeModal();
            return;
        }
        if (target.closest('#btn-client-tab-tx')) {
            store.setClientDetailsTab('lancamentos');
            return;
        }
        if (target.closest('#btn-client-tab-rd')) {
            store.setClientDetailsTab('resgates');
            return;
        }
        // Copy SMS code button
        const copyBtn = target.closest('[data-copy-code]');
        if (copyBtn) {
            const code = copyBtn.dataset.copyCode;
            if (code) {
                navigator.clipboard.writeText(code);
                store.showToast(`Código SMS ${code} copiado!`, 'info');
            }
            return;
        }
        // Redemption Flow Buttons
        const generateEmailBtn = target.closest('#btn-generate-email-code, #btn-resend-email-code');
        if (generateEmailBtn) {
            const clientId = generateEmailBtn.dataset.clientId;
            if (clientId) {
                const selectedCoupon = store.coupons.find(coupon => coupon.id === store.selectedCouponIdForRedemption);
                if (!selectedCoupon) {
                    store.showToast('Selecione um cupom disponível para continuar.', 'error');
                    return;
                }
                generateEmailBtn.disabled = true;
                const rd = await store.createRedemptionRequest(
                    clientId,
                    Number(selectedCoupon.pontosNecessarios),
                    Number(selectedCoupon.valorDescontoReais),
                    selectedCoupon.id,
                    selectedCoupon.titulo
                );
                if (rd) {
                    currentPendingRedemption = rd;
                    startRedemptionTimer(rd);
                }
            }
            return;
        }
        if (target.closest('#btn-confirm-email-code')) {
            const codeInput = document.getElementById('input-email-code-entered');
            if (codeInput && currentPendingRedemption) {
                const success = await store.confirmRedemption(currentPendingRedemption.id, codeInput.value);
                if (success) {
                    currentPendingRedemption = null;
                    clearInterval(redemptionTimerId);
                }
            }
            return;
        }
        if (target.closest('#btn-confirm-reject-tx')) {
            const textarea = document.getElementById('textarea-reject-reason');
            if (textarea && textarea.value.trim() && store.modalTxId) {
                await store.rejectTransaction(store.modalTxId, textarea.value.trim());
            }
            else {
                store.showToast('Por favor, digite a justificativa da rejeição.', 'error');
            }
            return;
        }
        if (target.closest('#btn-confirm-estorno-tx')) {
            const textarea = document.getElementById('textarea-estorno-reason');
            if (textarea && textarea.value.trim() && store.modalTxId) {
                await store.estornarTransaction(store.modalTxId, textarea.value.trim());
            }
            else {
                store.showToast('Por favor, digite a justificativa do estorno.', 'error');
            }
            return;
        }
        if (target.closest('#btn-confirm-estorno-rd')) {
            const textarea = document.getElementById('textarea-estorno-reason');
            if (textarea && textarea.value.trim() && store.modalRdId) {
                await store.estornarRedemption(store.modalRdId, textarea.value.trim());
            }
            else {
                store.showToast('Por favor, digite a justificativa do estorno.', 'error');
            }
            return;
        }
    });
    document.addEventListener('input', (e) => {
        const target = e.target;
        if (target.id === 'input-client-search') {
            const val = target.value;
            store.setSearchQuery(val);
        }
        if (target.id === 'input-audit-search') {
            const val = target.value;
            store.setAuditSearchQuery(val);
        }
        if (target.id === 'input-valor-compra') {
            const val = parseFloat(target.value) || 0;
            const pts = Math.floor(val * store.config.taxaConversaoReais);
            const preview = document.getElementById('preview-points-calculated');
            if (preview)
                preview.innerText = `+${pts} pts`;
        }
    });
    // Global Form Submit Delegations
    document.addEventListener('submit', async (e) => {
        e.preventDefault();
        const target = e.target;
        if (target.id === 'form-login') {
            const formData = new FormData(target);
            const loginVal = formData.get('login') || '';
            const passVal = formData.get('senha') || '';
            store.login(loginVal, passVal);
            return;
        }
        if (target.id === 'form-new-client') {
            const formData = new FormData(target);
            const nome = formData.get('nome');
            const telefone = formData.get('telefone');
            const email = formData.get('email');
            const cpf = formData.get('cpf');
            if (nome && telefone && email) {
                await store.registerNewClient(nome, telefone, email, cpf);
            }
            return;
        }
        if (target.id === 'form-edit-client') {
            const formData = new FormData(target);
            const clientId = formData.get('clientId');
            const nome = (formData.get('nome') || '').trim();
            const telefone = (formData.get('telefone') || '').trim();
            const email = (formData.get('email') || '').trim();
            const cpf = (formData.get('cpf') || '').trim();
            const saldoPontos = Number(formData.get('saldoPontos'));
            if (!clientId || nome.length < 2 || telefone.length < 8 || !email.includes('@') || !Number.isInteger(saldoPontos) || saldoPontos < 0) {
                store.showToast('Confira o nome, telefone, e-mail e saldo de pontos.', 'error');
                return;
            }
            await store.saveClientInfo(clientId, { nome, telefone, email, cpf, saldoPontos });
            return;
        }
        if (target.id === 'form-add-points') {
            const formData = new FormData(target);
            const clientId = formData.get('clientId');
            const comanda = formData.get('numeroComanda');
            const valor = parseFloat(formData.get('valorCompra'));
            if (clientId && comanda && valor > 0) {
                await store.addPointsTransaction(clientId, comanda, valor);
            }
            else {
                store.showToast('Preencha os campos obrigatórios.', 'error');
            }
            return;
        }
        if (target.id === 'form-user-modal') {
            const formData = new FormData(target);
            const nome = (formData.get('nome') || '').trim();
            const loginVal = (formData.get('login') || '').trim();
            const perfil = (formData.get('perfil') || 'atendente');
            const password = formData.get('password') || '';
            const cotaDiaria = parseInt(formData.get('cotaDiaria') || '0', 10) || 500;
            const isEditing = Boolean(store.editingUserId);
            if (!nome || !loginVal || (!isEditing && password.length < 8) || (password && password.length < 8)) {
                store.showToast('Preencha os dados e use uma senha com pelo menos 8 caracteres.', 'error');
            }
            else {
                await store.saveUser({ nome, login: loginVal, perfil, cotaDiariaPontos: cotaDiaria, password });
            }
            return;
        }
        if (target.id === 'form-coupon-modal') {
            const formData = new FormData(target);
            const titulo = (formData.get('titulo') || '').trim();
            const descricao = (formData.get('descricao') || '').trim();
            const pontosNecessarios = parseInt(formData.get('pontosNecessarios') || '0', 10);
            const valorDescontoReais = parseFloat(formData.get('valorDescontoReais') || '0');
            const ativo = formData.get('ativo') === 'on';
            if (!titulo || !descricao || pontosNecessarios <= 0 || valorDescontoReais <= 0) {
                store.showToast('Preencha todos os campos do cupom corretamente.', 'error');
            }
            else {
                await store.saveCoupon({ titulo, descricao, pontosNecessarios, valorDescontoReais, ativo });
            }
            return;
        }
        if (target.id === 'form-system-config') {
            const formData = new FormData(target);
            const taxa = parseFloat(formData.get('taxaConversao'));
            const ptsResgate = parseInt(formData.get('valorResgatePts'), 10);
            const r$Resgate = parseFloat(formData.get('valorResgateR$'));
            const cota = parseInt(formData.get('cotaPadrao'), 10);
            const minSms = parseInt(formData.get('expiracaoMin'), 10);
            store.saveSystemConfig({
                taxaConversaoReais: taxa,
                valorResgatePontos: ptsResgate,
                valorResgateReais: r$Resgate,
                cotaDiariaPadrao: cota,
                expiracaoCodigoMinutos: minSms
            });
        }
    });
}
