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
    managerAuthError = null;
    managerAuthTargetUserId = null;
    clientDetailsTab = 'lancamentos';
    // Toast notification
    toast = null;
    listeners = [];
    constructor() {
        // Load from LocalStorage if available
        const savedUsers = localStorage.getItem('fidelidade_users');
        const savedCoupons = localStorage.getItem('fidelidade_coupons');
        const savedClients = localStorage.getItem('fidelidade_clients');
        const savedTx = localStorage.getItem('fidelidade_transactions');
        const savedRd = localStorage.getItem('fidelidade_redemptions');
        const savedAudit = localStorage.getItem('fidelidade_audit');
        const savedSms = localStorage.getItem('fidelidade_sms');
        const savedConfig = localStorage.getItem('fidelidade_config');
        this.users = savedUsers ? JSON.parse(savedUsers) : [...INITIAL_USERS];
        this.coupons = savedCoupons ? JSON.parse(savedCoupons) : [...INITIAL_COUPONS];
        this.currentUser = this.users[0] || INITIAL_USERS[0]; // Ana Silva (Atendente) by default
        this.config = savedConfig ? JSON.parse(savedConfig) : { ...INITIAL_CONFIG };
        this.clients = savedClients ? JSON.parse(savedClients) : [...INITIAL_CLIENTS];
        this.transactions = savedTx ? JSON.parse(savedTx) : [...INITIAL_TRANSACTIONS];
        this.redemptions = savedRd ? JSON.parse(savedRd) : [...INITIAL_REDEMPTIONS];
        this.auditLogs = savedAudit ? JSON.parse(savedAudit) : [...INITIAL_AUDIT_LOGS];
        this.smsLogs = savedSms ? JSON.parse(savedSms) : [...INITIAL_SMS_LOGS];
        this.restoreSession();
    }
    async restoreSession() {
        try {
            const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
            if (!response.ok)
                return;
            const { user } = await response.json();
            this.currentUser = user;
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
    async loadStateFromDatabase() {
        try {
            const res = await fetch('/api/state', { credentials: 'same-origin' });
            if (res.ok) {
                const data = await res.json();
                if (data.clients && data.clients.length > 0)
                    this.clients = data.clients;
                if (data.users) {
                    this.users = data.users;
                    const refreshedCurrentUser = data.users.find(user => user.id === this.currentUser.id);
                    if (refreshedCurrentUser)
                        this.currentUser = refreshedCurrentUser;
                }
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
                        motivoPendente: t.motivoRejeicao,
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
                if (data.config) {
                    this.config = data.config;
                }
                this.notify();
            }
        }
        catch (e) {
            console.warn('Backend DB fetch error, using local fallback:', e);
        }
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
            const response = await fetch('/api/auth/login', {
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
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => { });
        this.isAuthenticated = false;
        this.loginError = null;
        this.showToast('Sessão encerrada.', 'info');
        this.notify();
    }
    setCurrentUser(userId) {
        const found = this.users.find(u => u.id === userId);
        if (found) {
            this.currentUser = found;
            this.addAuditLog('login_usuario', `Sessão alterada para operador ${found.nome} (${found.perfil})`);
            if (found.perfil === 'atendente' && this.activeTab === 'manager') {
                this.activeTab = 'dashboard';
            }
            this.showToast(`Operador alterado para ${found.nome}`, 'info');
            this.notify();
        }
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
        this.managerAuthError = null;
        this.notify();
    }
    // --- USER MANAGEMENT ---
    async saveUser(userData) {
        const editingId = this.editingUserId;
        try {
            const response = await fetch(editingId ? `/api/users/${encodeURIComponent(editingId)}` : '/api/users', {
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
            const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
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
    saveCoupon(couponData) {
        if (this.editingCouponId) {
            const cup = this.coupons.find(c => c.id === this.editingCouponId);
            if (cup) {
                cup.titulo = couponData.titulo;
                cup.descricao = couponData.descricao;
                cup.pontosNecessarios = couponData.pontosNecessarios;
                cup.valorDescontoReais = couponData.valorDescontoReais;
                cup.ativo = couponData.ativo;
                this.addAuditLog('edicao_config', `Cupom "${cup.titulo}" atualizado pelo Gerente ${this.currentUser.nome}`);
                this.showToast(`Cupom "${cup.titulo}" atualizado!`);
            }
        }
        else {
            const newCup = {
                id: `cup-${Date.now()}`,
                titulo: couponData.titulo,
                descricao: couponData.descricao,
                pontosNecessarios: couponData.pontosNecessarios,
                valorDescontoReais: couponData.valorDescontoReais,
                ativo: couponData.ativo,
                dataCriacao: new Date().toISOString()
            };
            this.coupons.unshift(newCup);
            this.addAuditLog('edicao_config', `Novo cupom "${newCup.titulo}" (${newCup.pontosNecessarios} pts) criado pelo Gerente ${this.currentUser.nome}`);
            this.showToast(`Cupom "${newCup.titulo}" criado com sucesso!`);
        }
        this.closeModal();
    }
    toggleCouponStatus(couponId) {
        const cup = this.coupons.find(c => c.id === couponId);
        if (!cup)
            return;
        cup.ativo = !cup.ativo;
        this.addAuditLog('edicao_config', `Cupom "${cup.titulo}" ${cup.ativo ? 'ativado' : 'desativado'}`);
        this.showToast(`Cupom "${cup.titulo}" ${cup.ativo ? 'Ativado' : 'Desativado'}.`);
        this.notify();
    }
    deleteCoupon(couponId) {
        const cup = this.coupons.find(c => c.id === couponId);
        if (!cup)
            return;
        this.coupons = this.coupons.filter(c => c.id !== couponId);
        this.addAuditLog('edicao_config', `Cupom "${cup.titulo}" removido pelo Gerente ${this.currentUser.nome}`);
        this.showToast(`Cupom "${cup.titulo}" removido.`);
        this.notify();
    }
    // --- CLIENT EDITING ---
    async saveClientInfo(clientId, data) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client)
            return false;
        const oldSaldo = client.saldoPontos;
        const changes = {
            nome: data.nome.trim(),
            telefone: data.telefone.trim(),
            cpf: data.cpf?.trim() || '',
            saldoPontos: Number(data.saldoPontos)
        };
        try {
            const response = await fetch(`/api/clients/${encodeURIComponent(clientId)}`, {
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
        client.cpf = changes.cpf || undefined;
        client.saldoPontos = changes.saldoPontos;
        let logDetail = `Dados do cliente ${client.nome} atualizados (${client.telefone})`;
        if (oldSaldo !== changes.saldoPontos) {
            logDetail += `. Saldo alterado de ${oldSaldo} pts para ${changes.saldoPontos} pts por ${this.currentUser.nome}`;
        }
        this.addAuditLog('cadastro_cliente', logDetail, undefined, client.telefone);
        this.showToast(`Cadastro do cliente ${client.nome} atualizado com sucesso!`);
        this.closeModal();
        return true;
    }
    async deleteClient(clientId) {
        const client = this.clients.find(item => item.id === clientId);
        if (!client)
            return false;
        try {
            const response = await fetch(`/api/clients/${encodeURIComponent(clientId)}`, {
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
    getPontosLancadosHoje(userId) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return this.transactions
            .filter(t => t.usuarioId === userId && t.status === 'aprovado' && new Date(t.dataHora) >= startOfToday)
            .reduce((acc, t) => acc + t.pontosGerados, 0);
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
    async registerNewClient(nome, telefone, cpf) {
        let newClient;
        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ nome, telefone, cpf })
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
        this.addAuditLog('cadastro_cliente', `Novo cliente cadastrado: ${nome}`, undefined, telefone);
        this.sendSms(telefone, nome, `Bem-vindo ao Clube de Fidelidade do ${this.config.nomeEstabelecimento}! Faça suas compras e troque pontos por prêmios e descontos exclusivos! 🎁`, 'boas_vindas');
        this.showToast(`Cliente ${nome} cadastrado com sucesso!`);
        this.closeModal();
        return newClient;
    }
    addPointsTransaction(clientId, numeroComanda, valorCompra) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client)
            return;
        const pontosGerados = Math.floor(valorCompra * this.config.taxaConversaoReais);
        const quotaRestante = this.getRemainingQuotaForUser(this.currentUser.id);
        const isExceeded = pontosGerados > quotaRestante;
        const status = isExceeded ? 'pendente' : 'aprovado';
        const tx = {
            id: `tx-${Date.now()}`,
            clienteId: client.id,
            clienteNome: client.nome,
            clienteTelefone: client.telefone,
            usuarioId: this.currentUser.id,
            usuarioNome: this.currentUser.nome,
            numeroComanda: numeroComanda.toUpperCase(),
            valorCompra,
            pontosGerados,
            status,
            motivoPendente: isExceeded ? `Excede cota diária de lançamentos do atendente (cota restante: ${quotaRestante} pts)` : undefined,
            dataHora: new Date().toISOString()
        };
        this.transactions.unshift(tx);
        if (status === 'aprovado') {
            client.saldoPontos += pontosGerados;
            client.totalPontosAcumulados += pontosGerados;
            client.totalGastoHistorico += valorCompra;
            client.nivel = this.calculateClientLevel(client.totalPontosAcumulados);
            this.addAuditLog('lancamento_pontos', `Lançamento de ${pontosGerados} pontos para o cliente ${client.nome} (Valor: R$ ${valorCompra.toFixed(2)})`, tx.numeroComanda, client.telefone);
            this.sendSms(client.telefone, client.nome, `${this.config.nomeEstabelecimento}: Você acumulou +${pontosGerados} pontos na comanda ${tx.numeroComanda}! Saldo atual: ${client.saldoPontos} pts.`, 'pontos_ganhos');
            this.showToast(`Lançamento de +${pontosGerados} pts realizado com sucesso!`);
        }
        else {
            this.addAuditLog('lancamento_pontos', `Lançamento excedeu a cota do atendente (${pontosGerados} pts). Lançamento enviado para aprovação do gerente.`, tx.numeroComanda, client.telefone);
            this.sendSms(client.telefone, client.nome, `${this.config.nomeEstabelecimento}: Sua compra da comanda ${tx.numeroComanda} (+${pontosGerados} pts) está aguardando aprovação do gerente.`, 'aprovacao_pendente');
            this.showToast(`Lançamento excedeu sua cota diária! Solicitação enviada ao Gerente.`, 'info');
        }
        this.closeModal();
    }
    approveTransaction(txId) {
        if (this.currentUser.perfil !== 'gerente') {
            this.showToast('Somente o Gerente pode aprovar lançamentos!', 'error');
            return;
        }
        const tx = this.transactions.find(t => t.id === txId);
        if (!tx || tx.status !== 'pendente')
            return;
        const client = this.clients.find(c => c.id === tx.clienteId);
        if (!client)
            return;
        tx.status = 'aprovado';
        tx.aprovadoPor = {
            usuarioId: this.currentUser.id,
            usuarioNome: this.currentUser.nome,
            dataHora: new Date().toISOString()
        };
        client.saldoPontos += tx.pontosGerados;
        client.totalPontosAcumulados += tx.pontosGerados;
        client.totalGastoHistorico += tx.valorCompra;
        client.nivel = this.calculateClientLevel(client.totalPontosAcumulados);
        this.addAuditLog('aprovacao_excedente', `Gerente ${this.currentUser.nome} APROVOU o lançamento de ${tx.pontosGerados} pts da comanda ${tx.numeroComanda}`, tx.numeroComanda, client.telefone);
        this.sendSms(client.telefone, client.nome, `${this.config.nomeEstabelecimento}: Seu lançamento da comanda ${tx.numeroComanda} foi APROVADO! +${tx.pontosGerados} pts creditados. Saldo: ${client.saldoPontos} pts.`, 'pontos_ganhos');
        this.showToast(`Lançamento da comanda ${tx.numeroComanda} APROVADO!`);
        this.notify();
    }
    rejectTransaction(txId, motivo) {
        if (this.currentUser.perfil !== 'gerente') {
            this.showToast('Somente o Gerente pode rejeitar lançamentos!', 'error');
            return;
        }
        const tx = this.transactions.find(t => t.id === txId);
        if (!tx || tx.status !== 'pendente')
            return;
        tx.status = 'rejeitado';
        tx.rejeitadoPor = {
            usuarioId: this.currentUser.id,
            usuarioNome: this.currentUser.nome,
            motivo,
            dataHora: new Date().toISOString()
        };
        this.addAuditLog('rejeicao_excedente', `Gerente ${this.currentUser.nome} REJEITOU o lançamento da comanda ${tx.numeroComanda}. Motivo: ${motivo}`, tx.numeroComanda, tx.clienteTelefone);
        this.showToast(`Lançamento rejeitado com sucesso.`, 'info');
        this.closeModal();
    }
    estornarTransaction(txId, motivo) {
        if (this.currentUser.perfil !== 'gerente') {
            this.showToast('Somente o Gerente pode efetuar estornos!', 'error');
            return;
        }
        const tx = this.transactions.find(t => t.id === txId);
        if (!tx || tx.status !== 'aprovado')
            return;
        const client = this.clients.find(c => c.id === tx.clienteId);
        if (client) {
            client.saldoPontos = Math.max(0, client.saldoPontos - tx.pontosGerados);
        }
        tx.status = 'estornado';
        tx.estornadoPor = {
            usuarioId: this.currentUser.id,
            usuarioNome: this.currentUser.nome,
            motivo,
            dataHora: new Date().toISOString()
        };
        this.addAuditLog('estorno_pontos', `Gerente ESTORNOU ${tx.pontosGerados} pts da comanda ${tx.numeroComanda}. Motivo: ${motivo}`, tx.numeroComanda, tx.clienteTelefone);
        this.showToast(`Lançamento da comanda ${tx.numeroComanda} estornado com sucesso!`);
        this.closeModal();
    }
    createRedemptionRequest(clientId, pontosUtilizados, valorDescontoReais, cupomId, cupomTitulo) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client || client.saldoPontos < pontosUtilizados) {
            this.showToast('Saldo de pontos insuficiente!', 'error');
            return null;
        }
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        const expiraEm = new Date(Date.now() + this.config.expiracaoCodigoMinutos * 60000).toISOString();
        const rd = {
            id: `rd-${Date.now()}`,
            clienteId: client.id,
            clienteNome: client.nome,
            clienteTelefone: client.telefone,
            usuarioId: this.currentUser.id,
            usuarioNome: this.currentUser.nome,
            cupomId,
            cupomTitulo,
            pontosUtilizados,
            valorDescontoReais,
            codigoConfirmacao: codigo,
            codigoExpiraEm: expiraEm,
            status: 'pendente',
            dataHora: new Date().toISOString()
        };
        this.redemptions.unshift(rd);
        const smsMsg = cupomTitulo
            ? `${this.config.nomeEstabelecimento}: Seu código para o cupom "${cupomTitulo}" é: ${codigo}. Desconto: R$ ${valorDescontoReais.toFixed(2)} (${pontosUtilizados} pts). Válido por ${this.config.expiracaoCodigoMinutos} min.`
            : `${this.config.nomeEstabelecimento}: Seu código de autorização de resgate de R$ ${valorDescontoReais.toFixed(2)} é: ${codigo}. Válido por ${this.config.expiracaoCodigoMinutos} minutos.`;
        this.sendSms(client.telefone, client.nome, smsMsg, 'codigo_resgate', codigo);
        this.showToast(`Código SMS enviado para ${client.nome}! (${codigo})`, 'info');
        return rd;
    }
    confirmRedemption(redemptionId, codigoEntered) {
        const rd = this.redemptions.find(r => r.id === redemptionId);
        if (!rd) {
            this.showToast('Solicitação de resgate não encontrada.', 'error');
            return false;
        }
        if (rd.status !== 'pendente') {
            this.showToast('Este resgate já foi processado ou expirou.', 'error');
            return false;
        }
        if (new Date() > new Date(rd.codigoExpiraEm)) {
            rd.status = 'expirado';
            this.showToast('O código SMS expirou! Gere um novo código.', 'error');
            this.notify();
            return false;
        }
        if (rd.codigoConfirmacao !== codigoEntered.trim()) {
            this.showToast('Código SMS incorreto! Verifique e tente novamente.', 'error');
            return false;
        }
        const client = this.clients.find(c => c.id === rd.clienteId);
        if (!client || client.saldoPontos < rd.pontosUtilizados) {
            this.showToast('Saldo insuficiente para concluir o resgate.', 'error');
            return false;
        }
        client.saldoPontos -= rd.pontosUtilizados;
        client.totalResgates += rd.pontosUtilizados;
        rd.status = 'confirmado';
        this.addAuditLog('resgate_pontos', `Resgate de R$ ${rd.valorDescontoReais.toFixed(2)} (-${rd.pontosUtilizados} pts) confirmado via SMS para ${client.nome}`, undefined, client.telefone);
        this.sendSms(client.telefone, client.nome, `${this.config.nomeEstabelecimento}: Resgate de R$ ${rd.valorDescontoReais.toFixed(2)} de desconto confirmado! (-${rd.pontosUtilizados} pts). Saldo atual: ${client.saldoPontos} pts.`, 'resgate_sucesso');
        this.showToast(`Resgate de R$ ${rd.valorDescontoReais.toFixed(2)} APLICADO com sucesso!`);
        this.closeModal();
        return true;
    }
    estornarRedemption(rdId, motivo) {
        if (this.currentUser.perfil !== 'gerente') {
            this.showToast('Somente o Gerente pode estornar resgates!', 'error');
            return;
        }
        const rd = this.redemptions.find(r => r.id === rdId);
        if (!rd || rd.status !== 'confirmado')
            return;
        const client = this.clients.find(c => c.id === rd.clienteId);
        if (client) {
            client.saldoPontos += rd.pontosUtilizados;
            client.totalResgates = Math.max(0, client.totalResgates - rd.pontosUtilizados);
        }
        rd.status = 'estornado';
        rd.estornadoPor = {
            usuarioId: this.currentUser.id,
            usuarioNome: this.currentUser.nome,
            motivo,
            dataHora: new Date().toISOString()
        };
        this.addAuditLog('estorno_resgate', `Gerente ESTORNOU resgate de R$ ${rd.valorDescontoReais.toFixed(2)} (+${rd.pontosUtilizados} pts devolvidos ao cliente). Motivo: ${motivo}`, undefined, rd.clienteTelefone);
        this.showToast(`Resgate estornado com sucesso! Pontos devolvidos.`);
        this.closeModal();
    }
    saveSystemConfig(newConfig) {
        if (this.currentUser.perfil !== 'gerente') {
            this.showToast('Somente o Gerente pode alterar configurações!', 'error');
            return;
        }
        this.config = { ...this.config, ...newConfig };
        this.addAuditLog('edicao_config', `Parâmetros do sistema alterados pelo Gerente ${this.currentUser.nome}`);
        this.showToast('Configurações do sistema atualizadas!');
        this.notify();
    }
}
export const store = new Store();
