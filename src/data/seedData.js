export const INITIAL_USERS = [
    {
        id: 'u-1',
        nome: 'Ana Silva',
        login: 'ana.caixa',
        perfil: 'atendente',
        cotaDiariaPontos: 500,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    {
        id: 'u-2',
        nome: 'Lucas Mendes',
        login: 'lucas.caixa',
        perfil: 'atendente',
        cotaDiariaPontos: 500,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
        id: 'u-3',
        nome: 'Carlos Eduardo',
        login: 'carlos.gerente',
        perfil: 'gerente',
        cotaDiariaPontos: 2000,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    }
];
export const INITIAL_COUPONS = [
    {
        id: 'cup-1',
        titulo: 'R$ 10 OFF na Comanda',
        descricao: 'Cupom tradicional de R$ 10,00 de desconto na conta final',
        pontosNecessarios: 100,
        valorDescontoReais: 10.0,
        ativo: true,
        dataCriacao: new Date().toISOString()
    },
    {
        id: 'cup-2',
        titulo: 'Sobremesa ou Shake Especial',
        descricao: 'Ganhe qualquer Sobremesa Gourmet ou Milkshake artesanal',
        pontosNecessarios: 150,
        valorDescontoReais: 18.0,
        ativo: true,
        dataCriacao: new Date().toISOString()
    },
    {
        id: 'cup-3',
        titulo: 'R$ 30 OFF no Combo Gourmet',
        descricao: 'Desconto de R$ 30,00 válido para combos e hambúrgueres duplos',
        pontosNecessarios: 250,
        valorDescontoReais: 30.0,
        ativo: true,
        dataCriacao: new Date().toISOString()
    }
];
export const INITIAL_CONFIG = {
    taxaConversaoReais: 1.0, // R$ 1,00 = 1 ponto
    valorResgatePontos: 100, // 100 pontos
    valorResgateReais: 10.0, // R$ 10,00 de desconto
    cotaDiariaPadrao: 500,
    expiracaoCodigoMinutos: 1,
    nomeEstabelecimento: 'Guaro El Buen Venezolano'
};
const todayISO = new Date().toISOString();
const yesterdayISO = new Date(Date.now() - 86400000).toISOString();
const twoDaysAgoISO = new Date(Date.now() - 172800000).toISOString();
export const INITIAL_CLIENTS = [
    {
        id: 'c-1',
        nome: 'Mariana Costa',
        telefone: '(11) 99887-1122',
        cpf: '341.231.889-12',
        saldoPontos: 240,
        dataCadastro: '2026-05-10',
        criadoPorUsuarioId: 'u-1',
        criadoPorUsuarioNome: 'Ana Silva',
        nivel: 'Ouro',
        totalGastoHistorico: 480.00,
        totalPontosAcumulados: 480,
        totalResgates: 240
    },
    {
        id: 'c-2',
        nome: 'Thiago Oliveira',
        telefone: '(11) 98765-4321',
        cpf: '128.941.503-44',
        saldoPontos: 95,
        dataCadastro: '2026-06-01',
        criadoPorUsuarioId: 'u-1',
        criadoPorUsuarioNome: 'Ana Silva',
        nivel: 'Prata',
        totalGastoHistorico: 195.00,
        totalPontosAcumulados: 195,
        totalResgates: 100
    },
    {
        id: 'c-3',
        nome: 'Beatriz Lima',
        telefone: '(11) 97123-8899',
        cpf: '450.812.900-55',
        saldoPontos: 180,
        dataCadastro: '2026-06-15',
        criadoPorUsuarioId: 'u-2',
        criadoPorUsuarioNome: 'Lucas Mendes',
        nivel: 'Bronze',
        totalGastoHistorico: 180.00,
        totalPontosAcumulados: 180,
        totalResgates: 0
    },
    {
        id: 'c-4',
        nome: 'Rafael Santos',
        telefone: '(11) 96543-2109',
        cpf: '210.987.654-32',
        saldoPontos: 520,
        dataCadastro: '2026-04-20',
        criadoPorUsuarioId: 'u-2',
        criadoPorUsuarioNome: 'Lucas Mendes',
        nivel: 'VIP Gourmet',
        totalGastoHistorico: 820.00,
        totalPontosAcumulados: 820,
        totalResgates: 300
    },
    {
        id: 'c-5',
        nome: 'Camila Rodriguez',
        telefone: '(11) 95432-1098',
        cpf: '543.210.987-65',
        saldoPontos: 40,
        dataCadastro: '2026-07-20',
        criadoPorUsuarioId: 'u-1',
        criadoPorUsuarioNome: 'Ana Silva',
        nivel: 'Bronze',
        totalGastoHistorico: 40.00,
        totalPontosAcumulados: 40,
        totalResgates: 0
    }
];
export const INITIAL_TRANSACTIONS = [
    {
        id: 'tx-101',
        clienteId: 'c-1',
        clienteNome: 'Mariana Costa',
        clienteTelefone: '(11) 99887-1122',
        usuarioId: 'u-1',
        usuarioNome: 'Ana Silva',
        numeroComanda: 'CMD-4892',
        valorCompra: 125.00,
        pontosGerados: 125,
        status: 'aprovado',
        dataHora: todayISO
    },
    {
        id: 'tx-102',
        clienteId: 'c-2',
        clienteNome: 'Thiago Oliveira',
        clienteTelefone: '(11) 98765-4321',
        usuarioId: 'u-2',
        usuarioNome: 'Lucas Mendes',
        numeroComanda: 'CMD-4893',
        valorCompra: 95.00,
        pontosGerados: 95,
        status: 'aprovado',
        dataHora: todayISO
    },
    {
        id: 'tx-103',
        clienteId: 'c-4',
        clienteNome: 'Rafael Santos',
        clienteTelefone: '(11) 96543-2109',
        usuarioId: 'u-1',
        usuarioNome: 'Ana Silva',
        numeroComanda: 'CMD-4898',
        valorCompra: 580.00,
        pontosGerados: 580,
        status: 'pendente',
        motivoPendente: 'Excede cota diária de lançamentos do atendente (cota atual: 500 pts)',
        dataHora: todayISO
    },
    {
        id: 'tx-100',
        clienteId: 'c-3',
        clienteNome: 'Beatriz Lima',
        clienteTelefone: '(11) 97123-8899',
        usuarioId: 'u-2',
        usuarioNome: 'Lucas Mendes',
        numeroComanda: 'CMD-4850',
        valorCompra: 180.00,
        pontosGerados: 180,
        status: 'aprovado',
        dataHora: yesterdayISO
    }
];
export const INITIAL_REDEMPTIONS = [
    {
        id: 'rd-201',
        clienteId: 'c-1',
        clienteNome: 'Mariana Costa',
        clienteTelefone: '(11) 99887-1122',
        usuarioId: 'u-1',
        usuarioNome: 'Ana Silva',
        pontosUtilizados: 100,
        valorDescontoReais: 10.00,
        codigoConfirmacao: '849201',
        codigoExpiraEm: new Date(Date.now() + 300000).toISOString(),
        status: 'confirmado',
        dataHora: yesterdayISO
    }
];
export const INITIAL_AUDIT_LOGS = [
    {
        id: 'log-1',
        usuarioId: 'u-1',
        usuarioNome: 'Ana Silva',
        usuarioPerfil: 'atendente',
        acao: 'login_usuario',
        detalhes: 'Sessão iniciada no terminal de caixa 01',
        dataHora: todayISO
    },
    {
        id: 'log-2',
        usuarioId: 'u-1',
        usuarioNome: 'Ana Silva',
        usuarioPerfil: 'atendente',
        acao: 'lancamento_pontos',
        detalhes: 'Lançamento de 125 pontos para cliente Mariana Costa',
        comandaRef: 'CMD-4892',
        clienteRef: '(11) 99887-1122',
        dataHora: todayISO
    },
    {
        id: 'log-3',
        usuarioId: 'u-1',
        usuarioNome: 'Ana Silva',
        usuarioPerfil: 'atendente',
        acao: 'lancamento_pontos',
        detalhes: 'Lançamento excedeu cota de 500 pts. Enviado para aprovação do gerente.',
        comandaRef: 'CMD-4898',
        clienteRef: '(11) 96543-2109',
        dataHora: todayISO
    }
];
export const INITIAL_SMS_LOGS = [
    {
        id: 'sms-1',
        telefoneDestino: '(11) 99887-1122',
        clienteNome: 'Mariana Costa',
        mensagem: 'Guaro: Você ganhou 125 pontos na comanda CMD-4892. Seu novo saldo é 240 pts.',
        tipo: 'pontos_ganhos',
        dataHora: todayISO,
        lida: true
    },
    {
        id: 'sms-2',
        telefoneDestino: '(11) 96543-2109',
        clienteNome: 'Rafael Santos',
        mensagem: 'Guaro: Sua compra da comanda CMD-4898 (580 pts) está aguardando liberação do gerente.',
        tipo: 'aprovacao_pendente',
        dataHora: todayISO,
        lida: false
    }
];
