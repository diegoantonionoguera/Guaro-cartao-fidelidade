import { store } from './store';
import { renderNavbar } from './ui/navbar';
import { renderClientList } from './ui/clientList';
import { renderManagerPanel } from './ui/managerPanel';
import { renderModals } from './ui/modals';
import { renderToast } from './ui/toast';
import { renderLoginView } from './ui/login';
import { setSafeHtml } from './ui/safeHtml';
import { applyTheme, getTheme } from './theme';
let currentPendingRedemption = null;
let redemptionTimerId = null;
let autoSyncTimerId = null;
let autoSyncInProgress = false;
let pendingScreenRefresh = false;
let previousPrimaryTab = null;
let previousManagerSubTab = null;
let previousPendingCount = null;
let pendingBadgePulseUntil = 0;
let lastNavbarMarkup = '';
let modalFrameId = null;
let modalExitTimerId = null;
let modalExitLayer = null;
let modalExitHandler = null;
let mountedModalName = null;
let lastModalMarkup = '';
let modalReturnFocus = null;
const toastFrameIds = new Map();
const toastExitHandles = new Map();

function openClientModalWithTransition(modal, clientId, trigger, transitionName) {
    const openModal = () => store.openModal(modal, clientId);
    const card = trigger.closest('[data-client-card]');
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduceMotion || !card) {
        openModal();
        return;
    }
    const root = document.documentElement;
    const transitionClass = `${transitionName}-transition`;
    const cleanup = () => {
        root.classList.remove(transitionClass);
        card.style.removeProperty('view-transition-name');
    };
    root.classList.add(transitionClass);
    card.style.viewTransitionName = transitionName;
    try {
        const transition = document.startViewTransition(async () => {
            openModal();
            await new Promise(resolve => requestAnimationFrame(resolve));
        });
        transition.finished.catch(() => {}).finally(cleanup);
    }
    catch {
        cleanup();
        openModal();
    }
}

async function runFormAction(form, action) {
    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button?.innerHTML;
    form.setAttribute('aria-busy', 'true');
    if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="busy-spinner" aria-hidden="true"></span><span>Processando...</span>';
    }
    try {
        await action();
    }
    finally {
        form.removeAttribute('aria-busy');
        if (button?.isConnected) {
            button.disabled = false;
            button.innerHTML = originalLabel;
        }
    }
}

function confirmAction({ title, message, confirmLabel = 'Confirmar' }) {
    return new Promise(resolve => {
        const dialog = document.createElement('dialog');
        dialog.className = 'confirm-dialog';
        dialog.setAttribute('aria-labelledby', 'confirm-dialog-title');
        const panel = document.createElement('div');
        panel.className = 'confirm-dialog-panel';
        const heading = document.createElement('h2');
        heading.id = 'confirm-dialog-title';
        heading.textContent = title;
        const copy = document.createElement('p');
        copy.textContent = message;
        const actions = document.createElement('div');
        actions.className = 'confirm-dialog-actions';
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'button-secondary';
        cancel.textContent = 'Cancelar';
        const confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.className = 'button-danger';
        confirm.textContent = confirmLabel;
        actions.append(cancel, confirm);
        panel.append(heading, copy, actions);
        dialog.append(panel);
        document.body.append(dialog);
        const finish = accepted => {
            dialog.close();
            dialog.remove();
            resolve(accepted);
        };
        cancel.addEventListener('click', () => finish(false));
        confirm.addEventListener('click', () => finish(true));
        dialog.addEventListener('cancel', event => {
            event.preventDefault();
            finish(false);
        });
        dialog.showModal();
        cancel.focus();
    });
}
// Mantém o consumo da API do Google Sheets abaixo dos limites do plano gratuito.
const AUTO_SYNC_INTERVAL_MS = 15000;

function isUserPerformingAction() {
    if (store.activeModal !== 'none')
        return true;
    const activeElement = document.activeElement;
    return Boolean(activeElement &&
        activeElement !== document.body &&
        activeElement.matches('input, textarea, select, [contenteditable="true"]'));
}

function applyPendingScreenRefresh() {
    if (!pendingScreenRefresh || isUserPerformingAction())
        return;
    pendingScreenRefresh = false;
    renderApp();
}

async function synchronizeInBackground() {
    if (!store.isAuthenticated || autoSyncInProgress || document.visibilityState === 'hidden')
        return;
    autoSyncInProgress = true;
    try {
        const changed = await store.loadStateFromDatabase({ notify: false });
        if (!changed)
            return;
        if (isUserPerformingAction()) {
            pendingScreenRefresh = true;
            return;
        }
        renderApp();
    }
    finally {
        autoSyncInProgress = false;
    }
}

function startAutomaticSynchronization() {
    if (autoSyncTimerId)
        clearInterval(autoSyncTimerId);
    autoSyncTimerId = setInterval(synchronizeInBackground, AUTO_SYNC_INTERVAL_MS);
}
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
            status.className = 'text-xs font-semibold text-red-300';
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
    setSafeHtml(container, rows.length ? `
        <div class="space-y-4">
          <h3 class="text-sm font-extrabold text-white">Volume de vendas por atendente</h3>
          <div class="space-y-3">
            ${rows.map(([name, total]) => `
              <div class="grid grid-cols-[120px_1fr_100px] items-center gap-3 text-xs">
                <span class="truncate text-zinc-300">${name}</span>
                <progress class="secure-progress w-full" max="100" value="${Math.max(3, total / maximum * 100)}" aria-label="${name}: R$ ${total.toFixed(2)}"></progress>
                <strong class="text-right text-amber-400">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
              </div>
    `).join('')}
          </div>
        </div>` : '<p class="py-8 text-center text-xs text-zinc-500">Nenhuma venda aprovada.</p>');
}

function getSanitizedElement(markup, selector) {
    const staging = document.createElement('div');
    setSafeHtml(staging, markup);
    return staging.querySelector(selector);
}

function refreshPanel(layer, markup, panelSelector) {
    const nextLayer = getSanitizedElement(markup, '[data-modal-layer]');
    const currentPanel = layer.querySelector(panelSelector);
    const nextPanel = nextLayer?.querySelector(panelSelector);
    if (!currentPanel || !nextPanel)
        return false;
    currentPanel.className = nextPanel.className;
    setSafeHtml(currentPanel, nextPanel.innerHTML);
    return true;
}

function resetPrimaryMotionState() {
    previousPrimaryTab = null;
    previousManagerSubTab = null;
    previousPendingCount = null;
    pendingBadgePulseUntil = 0;
    lastNavbarMarkup = '';
}

function renderNavbarWithMotion(container) {
    const pendingCount = store.transactions.filter(transaction => transaction.status === 'pendente').length;
    const now = performance.now();
    if (previousPendingCount !== null && pendingCount > 0 && pendingCount !== previousPendingCount)
        pendingBadgePulseUntil = now + 240;
    const markup = renderNavbar({
        animatePendingBadge: now < pendingBadgePulseUntil
    });
    previousPendingCount = pendingCount;
    if (markup === lastNavbarMarkup)
        return;
    setSafeHtml(container, markup);
    lastNavbarMarkup = markup;
}

function cancelModalExit() {
    if (modalExitTimerId) {
        clearTimeout(modalExitTimerId);
        modalExitTimerId = null;
    }
    if (modalExitLayer && modalExitHandler)
        modalExitLayer.removeEventListener('transitionend', modalExitHandler);
    modalExitLayer = null;
    modalExitHandler = null;
}

function teardownModal(container) {
    if (modalFrameId) {
        cancelAnimationFrame(modalFrameId);
        modalFrameId = null;
    }
    cancelModalExit();
    mountedModalName = null;
    lastModalMarkup = '';
    modalReturnFocus = null;
    setSafeHtml(container, '');
}

function enhanceModalAccessibility(layer, { focus = false } = {}) {
    const panel = layer.querySelector('[data-modal-panel]');
    if (!panel)
        return;
    const title = panel.querySelector('h1, h2, h3');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    if (title) {
        title.id = 'active-modal-title';
        panel.setAttribute('aria-labelledby', title.id);
    }
    if (!focus)
        return;
    const initialFocus = panel.querySelector('input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)');
    initialFocus?.focus({ preventScroll: true });
}

function ensureLabelAssociations(root) {
    root.querySelectorAll('label:not([for])').forEach((label, index) => {
        const field = label.parentElement?.querySelector('input, select, textarea');
        if (!field || field.closest('label') === label)
            return;
        if (!field.id)
            field.id = `field-${index}-${field.name || field.type || 'control'}`;
        label.htmlFor = field.id;
    });
}

function syncModal(container) {
    let layer = container.querySelector('[data-modal-layer]');
    const activeModal = store.activeModal;
    if (activeModal !== 'none') {
        const markup = renderModals();
        if (layer && mountedModalName === activeModal) {
            cancelModalExit();
            if (markup !== lastModalMarkup) {
                refreshPanel(layer, markup, '[data-modal-panel]');
                lastModalMarkup = markup;
                enhanceModalAccessibility(layer);
            }
            layer.dataset.state = 'open';
            return;
        }
        if (modalFrameId) {
            cancelAnimationFrame(modalFrameId);
            modalFrameId = null;
        }
        cancelModalExit();
        if (layer)
            layer.remove();
        modalReturnFocus = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        setSafeHtml(container, markup);
        layer = container.querySelector('[data-modal-layer]');
        mountedModalName = activeModal;
        lastModalMarkup = markup;
        if (!layer)
            return;
        layer.dataset.modalName = activeModal;
        enhanceModalAccessibility(layer);
        modalFrameId = requestAnimationFrame(() => {
            modalFrameId = null;
            if (layer.isConnected &&
                layer.dataset.state === 'entering' &&
                store.activeModal === activeModal) {
                layer.dataset.state = 'open';
                enhanceModalAccessibility(layer, { focus: true });
            }
        });
        return;
    }
    if (!layer) {
        mountedModalName = null;
        lastModalMarkup = '';
        return;
    }
    if (modalFrameId) {
        cancelAnimationFrame(modalFrameId);
        modalFrameId = null;
    }
    if (layer.dataset.state === 'closing')
        return;
    layer.dataset.state = 'closing';
    const finish = () => {
        if (store.activeModal === 'none' &&
            layer.isConnected &&
            layer.dataset.state === 'closing') {
            layer.remove();
            mountedModalName = null;
            lastModalMarkup = '';
            if (modalReturnFocus?.isConnected)
                modalReturnFocus.focus();
            modalReturnFocus = null;
        }
        cancelModalExit();
    };
    modalExitLayer = layer;
    modalExitHandler = event => {
        if (event.target === layer && event.propertyName === 'opacity')
            finish();
    };
    layer.addEventListener('transitionend', modalExitHandler);
    modalExitTimerId = setTimeout(finish, 210);
}

function cancelToastExit(node) {
    const handle = toastExitHandles.get(node);
    if (!handle)
        return;
    clearTimeout(handle.timerId);
    node.removeEventListener('transitionend', handle.handler);
    toastExitHandles.delete(node);
}

function removeToastNode(node) {
    const frameId = toastFrameIds.get(node);
    if (frameId) {
        cancelAnimationFrame(frameId);
        toastFrameIds.delete(node);
    }
    cancelToastExit(node);
    node.remove();
}

function closeToastNode(node) {
    if (node.dataset.state === 'closing')
        return;
    const frameId = toastFrameIds.get(node);
    if (frameId) {
        cancelAnimationFrame(frameId);
        toastFrameIds.delete(node);
    }
    node.dataset.state = 'closing';
    const finish = () => {
        if (node.isConnected && node.dataset.state === 'closing')
            removeToastNode(node);
    };
    const handler = event => {
        if (event.target === node && event.propertyName === 'opacity')
            finish();
    };
    node.addEventListener('transitionend', handler);
    const timerId = setTimeout(finish, 200);
    toastExitHandles.set(node, { handler, timerId });
}

function syncToast(container) {
    const activeId = store.toast ? String(store.toast.id) : null;
    const existingNodes = [...container.querySelectorAll('[data-toast-id]')];
    let activeNode = existingNodes.find(node => node.dataset.toastId === activeId);
    existingNodes
        .filter(node => node !== activeNode)
        .forEach(closeToastNode);
    if (store.toast && !activeNode) {
        const staging = document.createElement('div');
        setSafeHtml(staging, renderToast(store.toast));
        activeNode = staging.firstElementChild;
        if (activeNode) {
            container.append(activeNode);
            const frameId = requestAnimationFrame(() => {
                toastFrameIds.delete(activeNode);
                if (activeNode.isConnected &&
                    activeNode.dataset.state === 'entering' &&
                    String(store.toast?.id) === activeId)
                    activeNode.dataset.state = 'open';
            });
            toastFrameIds.set(activeNode, frameId);
        }
    }
    const allNodes = [...container.querySelectorAll('[data-toast-id]')];
    while (allNodes.length > 3) {
        const oldestClosing = allNodes.find(node => node.dataset.state === 'closing');
        if (!oldestClosing)
            break;
        removeToastNode(oldestClosing);
        allNodes.splice(allNodes.indexOf(oldestClosing), 1);
    }
}

function renderApp() {
    const navbarContainer = document.getElementById('navbar-container');
    const mainContainer = document.getElementById('main-container');
    const modalsContainer = document.getElementById('modals-container');
    const toastContainer = document.getElementById('toast-container');
    if (!store.isAuthenticated) {
        if (navbarContainer)
            setSafeHtml(navbarContainer, '');
        if (mainContainer)
            setSafeHtml(mainContainer, renderLoginView());
        if (modalsContainer)
            teardownModal(modalsContainer);
        if (toastContainer)
            syncToast(toastContainer);
        resetPrimaryMotionState();
        return;
    }
    if (navbarContainer)
        renderNavbarWithMotion(navbarContainer);
    if (mainContainer) {
        const animatePanelEntrance = store.activeTab === 'manager' && previousPrimaryTab !== 'manager';
        const animateTeamCardsEntrance = store.activeTab === 'manager' &&
            store.managerSubTab === 'usuarios' &&
            (previousPrimaryTab !== 'manager' || previousManagerSubTab !== 'usuarios');
        setSafeHtml(mainContainer, store.activeTab === 'dashboard'
            ? renderClientList()
            : renderManagerPanel({ animatePanelEntrance, animateTeamCardsEntrance }));
        ensureLabelAssociations(mainContainer);
        if (store.activeTab === 'manager') {
            requestAnimationFrame(() => {
                const tabs = mainContainer.querySelector('.manager-tabs');
                const activeTab = tabs?.querySelector('[aria-selected="true"]');
                if (!tabs || !activeTab)
                    return;
                const targetLeft = activeTab.offsetLeft - ((tabs.clientWidth - activeTab.offsetWidth) / 2);
                tabs.scrollTo({ left: Math.max(0, targetLeft), behavior: 'instant' });
            });
        }
    }
    previousPrimaryTab = store.activeTab;
    previousManagerSubTab = store.managerSubTab;
    if (modalsContainer)
        syncModal(modalsContainer);
    if (modalsContainer)
        ensureLabelAssociations(modalsContainer);
    if (toastContainer)
        syncToast(toastContainer);
    const chartMount = document.getElementById('recharts-sales-volume-mount');
    if (chartMount)
        renderSalesVolumeChart(chartMount);
}
// Initial Render and Subscribe to Store Changes
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
    store.subscribe(renderApp);
    setupEventDelegation();
    startAutomaticSynchronization();
    document.addEventListener('focusout', () => {
        setTimeout(applyPendingScreenRefresh, 150);
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible')
            synchronizeInBackground();
    });
    window.addEventListener('focus', synchronizeInBackground);
});
function setupEventDelegation() {
    document.addEventListener('keydown', (event) => {
        const currentTab = event.target.closest?.('[data-manager-subtab]');
        if (!currentTab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
            return;
        const tabs = [...currentTab.closest('[role="tablist"]').querySelectorAll('[data-manager-subtab]')];
        const currentIndex = tabs.indexOf(currentTab);
        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? tabs.length - 1
                : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        event.preventDefault();
        tabs[nextIndex].click();
    });
    // Global Click Event Delegation
    document.addEventListener('click', async (e) => {
        const target = e.target;
        if (!target)
            return;
        const themeToggle = target.closest('[data-theme-toggle]');
        if (themeToggle) {
            applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
            return;
        }
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
        if (target.closest('#btn-run-reconciliation')) {
            await store.runPointsReconciliation();
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
            if (userId && await confirmAction({
                title: 'Excluir usuário?',
                message: 'Este usuário perderá o acesso ao sistema imediatamente.',
                confirmLabel: 'Excluir usuário'
            }))
                await store.deleteUser(userId);
            return;
        }
        const deleteClientBtn = target.closest('[data-action="delete-client"]');
        if (deleteClientBtn) {
            const clientId = deleteClientBtn.dataset.clientId;
            if (clientId && await confirmAction({
                title: 'Excluir cliente?',
                message: 'O cadastro será removido da planilha. Esta ação não pode ser desfeita.',
                confirmLabel: 'Excluir cliente'
            }))
                await store.deleteClient(clientId);
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
            if (couponId && await confirmAction({
                title: 'Excluir cupom?',
                message: 'O cupom será removido do programa de fidelidade.',
                confirmLabel: 'Excluir cupom'
            }))
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
                openClientModalWithTransition('client-details', clientId, detailsBtn, 'client-details');
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
        if (target.matches('[data-modal-layer]')) {
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
            await runFormAction(target, () => store.login(loginVal, passVal));
            return;
        }
        if (target.id === 'form-new-client') {
            const formData = new FormData(target);
            const nome = formData.get('nome');
            const telefone = formData.get('telefone');
            const email = formData.get('email');
            const cpf = formData.get('cpf');
            if (nome && telefone && email) {
                await runFormAction(target, () => store.registerNewClient(nome, telefone, email, cpf));
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
            if (!clientId || nome.length < 2 || telefone.length < 8 || !email.includes('@')) {
                store.showToast('Confira o nome, telefone e e-mail.', 'error');
                return;
            }
            await runFormAction(target, () => store.saveClientInfo(clientId, { nome, telefone, email, cpf }));
            return;
        }
        if (target.id === 'form-add-points') {
            const formData = new FormData(target);
            const clientId = formData.get('clientId');
            const comanda = formData.get('numeroComanda');
            const valor = parseFloat(formData.get('valorCompra'));
            if (clientId && comanda && valor > 0) {
                await runFormAction(target, () => store.addPointsTransaction(clientId, comanda, valor));
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
                await runFormAction(target, () => store.saveUser({ nome, login: loginVal, perfil, cotaDiariaPontos: cotaDiaria, password }));
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
                await runFormAction(target, () => store.saveCoupon({ titulo, descricao, pontosNecessarios, valorDescontoReais, ativo }));
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
            await runFormAction(target, () => store.saveSystemConfig({
                taxaConversaoReais: taxa,
                valorResgatePontos: ptsResgate,
                valorResgateReais: r$Resgate,
                cotaDiariaPadrao: cota,
                expiracaoCodigoMinutos: minSms
            }));
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Tab' && store.activeModal !== 'none') {
            const panel = document.querySelector('[data-modal-panel]');
            const focusable = panel
                ? [...panel.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')]
                : [];
            if (focusable.length) {
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                }
                else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
            return;
        }
        if (event.key !== 'Escape')
            return;
        if (store.activeModal !== 'none') {
            event.preventDefault();
            currentPendingRedemption = null;
            if (redemptionTimerId)
                clearInterval(redemptionTimerId);
            store.closeModal();
        }
    });
}
