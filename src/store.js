import { INITIAL_USERS, INITIAL_COUPONS, INITIAL_CONFIG, INITIAL_CLIENTS, INITIAL_TRANSACTIONS, INITIAL_REDEMPTIONS, INITIAL_AUDIT_LOGS, INITIAL_SMS_LOGS } from './data/seedData';
class Store {
    currentUser;
    users;
    coupons;
    clients;
    transactions;
    redemptions;
    auditLogs;
    smsLogs;
    config;
    activeTab = 'dashboard';
    managerSubTab = 'pendentes';
    searchQuery = '';
    auditSearchQuery = '';
    isAuthenticated = false;
    loginError = null;
    isSmsDrawerOpen = false;
    showQuotaTooltip = false;
    // Modals state
    activeModal = 'none';
    modalClientId = null;
    modalTxId = null;
    modalRdId = null;
    editingUserId = null;
    editingCouponId = null;
    editingClientId = null;
    selectedCouponIdForRedemption = null;
    pendingRedemption = null;
    managerAuthError = null;
    managerAuthTargetUserId = null;
    clientDetailsTab = 'lancamentos';
    reconciliation = null;
    reconciliationLoading = false;
    // Toast notification
    toast = null;
    listeners = [];
    lastServerSnapshot = '';
    csrfToken = '';
    pendingMutations = new Set();
    constructor() {
        // Dados reais são carregados apenas da API autenticada.
        this.users = [...INITIAL_USERS];
        this.coupons = [...INITIAL_COUPONS];
        this.currentUser = this.users[0] || INITIAL_USERS[0]; // Ana Silva (Atendente) by default
        this.config = { ...INITIAL_CONFIG };
        this.clients = [...INITIAL_CLIENTS];
        this.transactions = [...INITIAL_TRANSACTIONS];
        this.redemptions = [...INITIAL_REDEMPTIONS];
        this.auditLogs = [...INITIAL_AUDIT_LOGS];
        this.smsLogs = [...INITIAL_SMS_LOGS];
        this.restoreSession();
    }
    async restoreSession() {
        try {
            const response = await this.request('/api/auth/session', { credentials: 'same-origin' });
            if (!response.ok)
                return;
            const { user, csrfToken } = await response.json();
            this.currentUser = user;
            this.csrfToken = csrfToken || '';
            this.isAuthenticated = true;
            await this.loadStateFromDatabase();
        }
        catch (error) {
            console.warn('Não foi possível restaurar a sessão:', error);
        }
        finally {
            this.notify();
        }
    }
    async loadStateFromDatabase(options = {}) {
        const { notify = true } = options;
        try {
            const res = await this.request('/api/state', { credentials: 'same-origin' });
            if (res.status === 401) {
                this.isAuthenticated = false;
                this.csrfToken = '';
                if (notify)
                    this.notify();
                return true;
            }
            if (res.ok) {
                const data = await res.json();
                const serverSnapshot = JSON.stringify(data);
                const changed = serverSnapshot !== this.lastServerSnapshot;
                this.lastServerSnapshot = serverSnapshot;
                if (Array.isArray(data.clients))
                    this.clients = data.clients;
                if (data.users) {
                    this.users = data.users;
                    const refreshedCurrentUser = data.users.find(user => user.id === this.currentUser.id);
                    if (refreshedCurrentUser)
                        this.currentUser = refreshedCurrentUser;
                }
                if (data.coupons)
                    this.coupons = data.coupons;
                if (data.transactions) {
                    this.transactions = data.transactions.map((t) => ({
                        id: t.id,
                        clienteId: t.clienteId,
                        clienteNome: t.clienteNome,
                        clienteTelefone: t.clienteTelefone || '',
                        usuarioId: t.usuarioId,
                        usuarioNome: t.usuarioNome,
                        numeroComanda: t.numeroComanda,
                        valorCompra: t.valorCompra,
                        pontosGerados: t.pontosGerados,
                        status: t.status,
                        motivoPendente: t.motivoPendente || t.motivoRejeicao,
                        dataHora: t.dataHora
                    }));
                }
                if (data.redemptions) {
                    this.redemptions = data.redemptions.map((r) => ({
                        id: r.id,
                        clienteId: r.clienteId,
                        clienteNome: r.clienteNome,
                        clienteTelefone: r.clienteTelefone || '',
                        usuarioId: r.usuarioId,
                        usuarioNome: r.usuarioNome,
                        pontosUtilizados: r.pontosUtilizados,
                        valorDescontoReais: r.valorDescontoReais,
                        codigoConfirmacao: r.codigoConfirmacao,
                        status: r.status,
                        dataHora: r.dataHora
                    }));
                }
                if (data.smsLogs) {
                    this.smsLogs = data.smsLogs.map((s) => ({
                        id: s.id,
                        clienteNome: s.clienteNome,
                        telefoneDestino: s.telefoneDestino,
                        mensagem: s.mensagem,
                        tipo: 'pontos_ganhos',
                        dataHora: s.dataHora,
                        lida: s.lida
                    }));
                }
                if (Array.isArray(data.auditLogs)) {
                    this.auditLogs = data.auditLogs
                        .map(log => ({
                            id: String(log.id || ''),
                            dataHora: log.dataHora || log.data || new Date(0).toISOString(),
                            acao: String(log.acao || 'acao_sistema'),
                            usuarioId: String(log.usuarioId || ''),
                            usuarioNome: String(log.usuarioNome || 'Sistema'),
                            usuarioPerfil: String(log.usuarioPerfil || 'sistema'),
                            detalhes: String(log.detalhes || ''),
                            categoria: String(log.categoria || 'SISTEMA'),
                            comandaRef: String(log.comandaRef || ''),
                            clienteRef: String(log.clienteRef || ''),
                            ip: String(log.ip || '')
                        }))
                        .sort((left, right) => new Date(right.dataHora) - new Date(left.dataHora));
                }
                if (data.config) {
                    this.config = data.config;
                }
                if (notify && changed)
                    this.notify();
                return changed;
            }
        }
        catch (e) {
            console.warn('Backend DB fetch error, using local fallback:', e);
        }
        return false;
    }
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    notify() {
        this.saveToStorage();
        this.listeners.forEach(l => l());
    }
    saveToStorage() {
        // Dados pessoais e operacionais não são persistidos no navegador.
    }
    async request(url, options = {}) {
        const method = String(options.method || 'GET').toUpperCase();
        const headers = { ...(options.headers || {}) };
        const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
        const mutationKey = `${method}:${url}`;
        if (isMutation && this.pendingMutations.has(mutationKey))
            throw new Error('Esta ação já está sendo processada. Aguarde a confirmação.');
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && this.csrfToken)
            headers['x-csrf-token'] = this.csrfToken;
        if (isMutation) this.pendingMutations.add(mutationKey);
        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: options.signal || AbortSignal.timeout(45_000)
            });
            if (response.status === 401 && !String(url).includes('/api/auth/login')) {
                this.isAuthenticated = false;
                this.csrfToken = '';
            }
            return response;
        }
        catch (error) {
            if (error.name === 'TimeoutError')
                throw new Error('O servidor demorou para responder. Verifique a conexão antes de repetir a ação.');
            throw error;
        }
        finally {
            if (isMutation) this.pendingMutations.delete(mutationKey);
        }
    }
    showToast(message, type = 'success') {
        this.toast = { message, type, id: Date.now() };
        this.notify();
        setTimeout(() => {
            if (this.toast && Date.now() - this.toast.id >= 3500) {
                this.toast = null;
                this.notify();
            }
        }, 3600);
    }
    async login(loginVal, passVal) {
        try {
            const response = await this.request('/api/auth/login', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ username: loginVal.trim(), password: passVal })
            });
            const responseText = await response.text();
            let data = {};
            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                }
                catch {
                    throw new Error('O servidor respondeu em formato inválido. Reinicie o backend e tente novamente.');
                }
            }
            if (!response.ok)
                throw new Error(data.error || 'Não foi possível entrar.');
            if (!data.user)
                throw new Error('O servidor não retornou uma sessão válida.');
            this.isAuthenticated = true;
            this.currentUser = data.user;
            this.csrfToken = data.csrfToken || '';
            this.loginError = null;
            this.showToast('Bem-vindo! Login realizado com sucesso.', 'success');
            await this.loadStateFromDatabase();
            this.notify();
            return true;
        }
        catch (error) {
            this.loginError = error.message;
            this.showToast(error.message, 'error');
            this.notify();
            return false;
        }
    }
    async logout() {
        await this.request('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => { });
        this.isAuthenticated = false;
        this.csrfToken = '';
        this.loginError = null;
        this.showToast('Sessão encerrada.', 'info');
        this.notify();
    }
    setActiveTab(tab) {
        this.activeTab = tab;
        this.notify();
    }
    setManagerSubTab(subTab) {
        this.managerSubTab = subTab;
        this.notify();
    }
    setSearchQuery(q) {
        this.searchQuery = q;
        this.notify();
    }
    setAuditSearchQuery(q) {
        this.auditSearchQuery = q;
        this.notify();
    }
    toggleSmsDrawer(open) {
        this.isSmsDrawerOpen = open !== undefined ? open : !this.isSmsDrawerOpen;
        this.notify();
    }
    toggleQuotaTooltip(open) {
        this.showQuotaTooltip = open !== undefined ? open : !this.showQuotaTooltip;
        this.notify();
    }
    openModal(modal, id) {
        this.activeModal = modal;
        this.managerAuthError = null;
        if (modal === 'add-points' || modal === 'redemption' || modal === 'client-details') {
            this.modalClientId = id || null;
            if (modal === 'redemption') {
                const client = this.clients.find(item => item.id === id);
                const firstAvailable = this.coupons.find(coupon => coupon.ativo && Number(coupon.pontosNecessarios) <= Number(client?.saldoPontos || 0));
                this.selectedCouponIdForRedemption = firstAvailable?.id || null;
            }
        }
        else if (modal === 'reject-tx' || modal === 'estorno-tx') {
            this.modalTxId = id || null;
        }
        else if (modal === 'estorno-rd') {
            this.modalRdId = id || null;
        }
        else if (modal === 'user-modal') {
            this.editingUserId = id || null;
        }
        else if (modal === 'coupon-modal') {
            this.editingCouponId = id || null;
        }
        else if (modal === 'edit-client') {
            this.editingClientId = id || null;
        }
        this.notify();
    }
    closeModal() {
        this.activeModal = 'none';
        this.modalClientId = null;
        this.modalTxId = null;
        this.modalRdId = null;
        this.editingUserId = null;
        this.editingCouponId = null;
        this.editingClientId = null;
        this.selectedCouponIdForRedemption = null;
        this.pendingRedemption = null;
        this.managerAuthError = null;
        this.notify();
    }
    // --- USER MANAGEMENT ---
    async saveUser(userData) {
        const editingId = this.editingUserId;
        try {
            const response = await this.request(editingId ? `/api/users/${encodeURIComponent(editingId)}` : '/api/users', {
                method: editingId ? 'PUT' : 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const responseText = await response.text();
            const result = responseText ? JSON.parse(responseText) : {};
            if (!response.ok)
                throw new Error(result.error || 'Não foi possível salvar o usuário.');
            if (editingId) {
                const index = this.users.findIndex(user => user.id === editingId);
                if (index >= 0)
                    this.users[index] = { ...this.users[index], ...result.user };
                this.showToast(`Usuário ${result.user.nome} atualizado com sucesso!`);
            }
            else {
                this.users.push(result.user);
                this.showToast(`Usuário ${result.user.nome} cadastrado com sucesso!`);
            }
            this.closeModal();
            return true;
        }
        catch (error) {
            this.showToast(error.message || 'Não foi possível salvar o usuário.', 'error');
            return false;
        }
    }
    async deleteUser(userId) {
        if (userId === this.currentUser.id) {
            this.showToast('Você não pode excluir o usuário atualmente conectado!', 'error');
            return false;
        }
        const user = this.users.find(u => u.id === userId);
        if (!user)
            return false;
        try {
            const response = await this.request(`/api/users/${encodeURIComponent(userId)}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || 'Não foi possível excluir o usuário.');
            }
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
        this.users = this.users.filter(u => u.id !== userId);
        this.showToast(`Usuário ${user.nome} removido do sistema.`);
        this.notify();
        return true;
    }
    // --- COUPON MANAGEMENT ---
    async saveCoupon(couponData, couponId = null) {
        const editingId = couponId || this.editingCouponId;
        try {
            const response = await this.request(editingId ? `/api/coupons/${encodeURIComponent(editingId)}` : '/api/coupons', {
                method: editingId ? 'PUT' : 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(couponData)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(result.error || 'Não foi possível salvar o cupom.');
            if (editingId) {
                const index = this.coupons.findIndex(coupon => coupon.id === editingId);
                if (index >= 0)
                    this.coupons[index] = { ...this.coupons[index], ...result.coupon };
                this.showToast(`Cupom "${result.coupon.titulo}" atualizado!`);
            }
            else {
                this.coupons.unshift(result.coupon);
                this.showToast(`Cupom "${result.coupon.titulo}" criado com sucesso!`);
            }
            this.closeModal();
            return true;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
    }
    async toggleCouponStatus(couponId) {
        const cup = this.coupons.find(c => c.id === couponId);
        if (!cup)
            return false;
        return this.saveCoupon({ ...cup, ativo: !cup.ativo }, couponId);
    }
    async deleteCoupon(couponId) {
        const cup = this.coupons.find(c => c.id === couponId);
        if (!cup)
            return false;
        try {
            const response = await this.request(`/api/coupons/${encodeURIComponent(couponId)}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || 'Não foi possível excluir o cupom.');
            }
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
        this.coupons = this.coupons.filter(c => c.id !== couponId);
        this.showToast(`Cupom "${cup.titulo}" removido.`);
        this.notify();
        return true;
    }
    selectCouponForRedemption(couponId) {
        this.selectedCouponIdForRedemption = couponId;
        this.notify();
    }
    // --- CLIENT EDITING ---
    async saveClientInfo(clientId, data) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client)
            return false;
        const changes = {
            nome: data.nome.trim(),
            telefone: data.telefone.trim(),
            email: data.email.trim().toLowerCase(),
            cpf: data.cpf?.trim() || ''
        };
        try {
            const response = await this.request(`/api/clients/${encodeURIComponent(clientId)}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(changes)
            });
            const responseText = await response.text();
            const result = responseText ? JSON.parse(responseText) : {};
            if (!response.ok)
                throw new Error(result.error || 'Erro ao atualizar cliente.');
        }
        catch (error) {
            this.showToast(error.message || 'Erro ao atualizar cliente.', 'error');
            return false;
        }
        client.nome = changes.nome;
        client.telefone = changes.telefone;
        client.email = changes.email;
        client.cpf = changes.cpf || undefined;
        this.showToast(`Cadastro do cliente ${client.nome} atualizado com sucesso!`);
        this.closeModal();
        return true;
    }
    async deleteClient(clientId) {
        const client = this.clients.find(item => item.id === clientId);
        if (!client)
            return false;
        try {
            const response = await this.request(`/api/clients/${encodeURIComponent(clientId)}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || 'Não foi possível excluir o cliente.');
            }
            this.clients = this.clients.filter(item => item.id !== clientId);
            this.showToast(`Cliente ${client.nome} excluído com sucesso.`);
            this.closeModal();
            return true;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
    }
    setClientDetailsTab(tab) {
        this.clientDetailsTab = tab;
        this.notify();
    }
    // Business calculations
    getTransactionsToday(userId) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
        return this.transactions.filter(transaction => {
            const date = new Date(transaction.dataHora);
            return String(transaction.usuarioId) === String(userId) &&
                transaction.status === 'aprovado' &&
                date >= startOfToday &&
                date < startOfTomorrow;
        });
    }
    getPontosLancadosHoje(userId) {
        return this.getTransactionsToday(userId)
            .reduce((total, transaction) => total + Number(transaction.pontosGerados || 0), 0);
    }
    getRemainingQuotaForUser(userId) {
        const user = this.users.find(u => u.id === userId) || this.currentUser;
        const lancadosHoje = this.getPontosLancadosHoje(userId);
        return Math.max(0, user.cotaDiariaPontos - lancadosHoje);
    }
    calculateClientLevel(totalPointsAcc) {
        if (totalPointsAcc >= 800)
            return 'VIP Gourmet';
        if (totalPointsAcc >= 400)
            return 'Ouro';
        if (totalPointsAcc >= 150)
            return 'Prata';
        return 'Bronze';
    }
    addAuditLog(acao, detalhes, comandaRef, clienteRef) {
        const log = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            usuarioId: this.currentUser.id,
            usuarioNome: this.currentUser.nome,
            usuarioPerfil: this.currentUser.perfil,
            acao,
            detalhes,
            comandaRef,
            clienteRef,
            dataHora: new Date().toISOString(),
            ipSimulado: '192.168.1.45'
        };
        this.auditLogs.unshift(log);
    }
    sendSms(telefoneDestino, clienteNome, mensagem, tipo, codigoRef) {
        const sms = {
            id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            telefoneDestino,
            clienteNome,
            mensagem,
            tipo,
            codigoRef,
            dataHora: new Date().toISOString(),
            lida: false
        };
        this.smsLogs.unshift(sms);
    }
    markAllSmsAsRead() {
        this.smsLogs.forEach(s => s.lida = true);
        this.notify();
    }
    markSmsAsRead(id) {
        const found = this.smsLogs.find(s => s.id === id);
        if (found)
            found.lida = true;
        this.notify();
    }
    // ACTIONS
    async registerNewClient(nome, telefone, email, cpf) {
        let newClient;
        try {
            const response = await this.request('/api/clients', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ nome, telefone, email, cpf })
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || 'Erro ao cadastrar cliente.');
            newClient = data.client;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return null;
        }
        this.clients.unshift(newClient);
        this.showToast(`Cliente ${nome} cadastrado com sucesso!`);
        this.closeModal();
        return newClient;
    }
    async addPointsTransaction(clientId, numeroComanda, valorCompra) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client)
            return false;
        try {
            const response = await this.request('/api/transactions', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ clientId, numeroComanda, valorCompra })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(result.error || 'Não foi possível registrar a compra.');
            this.transactions.unshift(result.transaction);
            if (result.client)
                Object.assign(client, result.client);
            this.showToast(result.transaction.status === 'aprovado'
                ? `Compra registrada: +${result.transaction.pontosGerados} pontos.`
                : 'Compra registrada e enviada para aprovação do gerente.',
            result.transaction.status === 'aprovado' ? 'success' : 'info');
            this.closeModal();
            return true;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
    }
    async approveTransaction(txId) {
        if (this.currentUser.perfil !== 'gerente') {
            this.showToast('Somente o Gerente pode aprovar lançamentos!', 'error');
            return false;
        }
        const tx = this.transactions.find(t => t.id === txId);
        if (!tx || tx.status !== 'pendente')
            return false;
        const client = this.clients.find(c => c.id === tx.clienteId);
        if (!client)
            return false;
        try {
            const response = await this.request(`/api/transactions/${encodeURIComponent(txId)}/approve`, {
                method: 'POST',
                credentials: 'same-origin'
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(result.error || 'Não foi possível aprovar o lançamento.');
            Object.assign(tx, result.transaction);
            Object.assign(client, result.client);
            this.showToast(`Lançamento da comanda ${tx.numeroComanda} aprovado!`);
            this.notify();
            return true;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
    }
    async rejectTransaction(txId, motivo) {
        if (this.currentUser.perfil !== 'gerente') {
            this.showToast('Somente o Gerente pode rejeitar lançamentos!', 'error');
            return false;
        }
        const tx = this.transactions.find(t => t.id === txId);
        if (!tx || tx.status !== 'pendente')
            return false;
        try {
            const response = await this.request(`/api/transactions/${encodeURIComponent(txId)}/reject`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ motivo })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(result.error || 'Não foi possível rejeitar o lançamento.');
            Object.assign(tx, result.transaction);
            this.showToast('Lançamento rejeitado com sucesso.', 'info');
            this.closeModal();
            return true;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
    }
    async estornarTransaction(txId, motivo) {
        if (this.currentUser.perfil !== 'gerente') {
            this.showToast('Somente o Gerente pode efetuar estornos!', 'error');
            return false;
        }
        const tx = this.transactions.find(t => t.id === txId);
        if (!tx || tx.status !== 'aprovado')
            return false;
        const client = this.clients.find(c => c.id === tx.clienteId);
        try {
            const response = await this.request(`/api/transactions/${encodeURIComponent(txId)}/reverse`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ motivo })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(result.error || 'Não foi possível estornar o lançamento.');
            Object.assign(tx, result.transaction);
            if (client)
                Object.assign(client, result.client);
            this.showToast(`Lançamento da comanda ${tx.numeroComanda} estornado com sucesso!`);
            this.closeModal();
            return true;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
    }
    async createRedemptionRequest(clientId, pontosUtilizados, valorDescontoReais, cupomId, cupomTitulo) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client || client.saldoPontos < pontosUtilizados) {
            this.showToast('Saldo de pontos insuficiente!', 'error');
            return null;
        }
        if (!client.email) {
            this.showToast('Cadastre o e-mail do cliente antes de solicitar o resgate.', 'error');
            return null;
        }
        try {
            const response = await this.request('/api/redemptions/request', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    clientId, points: pontosUtilizados, discount: valorDescontoReais,
                    couponId: cupomId, couponTitle: cupomTitulo
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(result.error || 'Não foi possível enviar o código por e-mail.');
            this.pendingRedemption = {
                ...result.redemption,
                maskedEmail: result.maskedEmail,
                expiresAt: result.expiresAt,
                entryWindowEndsAt: result.entryWindowEndsAt
            };
            this.redemptions.unshift(result.redemption);
            this.showToast(`Código enviado para ${result.maskedEmail}.`, 'info');
            return this.pendingRedemption;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return null;
        }
    }
    async confirmRedemption(redemptionId, codigoEntered) {
        const rd = this.redemptions.find(r => r.id === redemptionId);
        if (!rd)
            return false;
        const client = this.clients.find(c => c.id === rd.clienteId);
        try {
            const response = await this.request(`/api/redemptions/${encodeURIComponent(redemptionId)}/confirm`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ code: codigoEntered.trim() })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(result.error || 'Não foi possível confirmar o resgate.');
            if (client)
                Object.assign(client, result.client);
            rd.status = 'confirmado';
            this.showToast(`Resgate de R$ ${Number(rd.valorDescontoReais).toFixed(2)} aplicado com sucesso!`);
            this.closeModal();
            return true;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
    }
    async estornarRedemption(rdId, motivo) {
        if (this.currentUser.perfil !== 'gerente') {
            this.showToast('Somente o Gerente pode estornar resgates!', 'error');
            return false;
        }
        const rd = this.redemptions.find(r => r.id === rdId);
        if (!rd || rd.status !== 'confirmado')
            return false;
        const client = this.clients.find(c => c.id === rd.clienteId);
        try {
            const response = await this.request(`/api/redemptions/${encodeURIComponent(rdId)}/reverse`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ motivo })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(result.error || 'Não foi possível estornar o resgate.');
            Object.assign(rd, result.redemption);
            if (client)
                Object.assign(client, result.client);
            this.showToast('Resgate estornado com sucesso! Pontos devolvidos.');
            this.closeModal();
            return true;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
    }
    async saveSystemConfig(newConfig) {
        if (this.currentUser.perfil !== 'gerente') {
            this.showToast('Somente o Gerente pode alterar configurações!', 'error');
            return false;
        }
        const config = { ...this.config, ...newConfig };
        try {
            const response = await this.request('/api/config', {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(config)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(result.error || 'Não foi possível salvar a configuração.');
            this.config = result.config;
            this.showToast('Configurações do sistema atualizadas!');
            this.notify();
            return true;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
    }
    async runPointsReconciliation() {
        if (this.currentUser.perfil !== 'gerente' || this.reconciliationLoading)
            return false;
        this.reconciliationLoading = true;
        this.notify();
        try {
            const response = await this.request('/api/reconciliation', { credentials: 'same-origin' });
            const result = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(result.error || 'Não foi possível verificar os saldos.');
            this.reconciliation = result;
            const issues = Number(result.summary?.divergent || 0) + Number(result.summary?.duplicateReferences || 0);
            this.showToast(
                issues ? `${issues} inconsistência(s) encontrada(s).` : 'Saldos verificados sem divergências.',
                issues ? 'error' : 'success'
            );
            return true;
        }
        catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
        finally {
            this.reconciliationLoading = false;
            this.notify();
        }
    }
}
export const store = new Store();
