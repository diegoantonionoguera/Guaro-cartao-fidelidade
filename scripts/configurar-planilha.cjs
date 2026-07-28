require('dotenv').config();
const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const schemas = {
  clientes: [
    'id', 'nome', 'telefone', 'email', 'cpf', 'saldoPontos',
    'totalPontosAcumulados', 'totalResgates', 'totalGastoHistorico',
    'nivel', 'dataCadastro', 'criadoPorUsuarioId', 'criadoPorUsuarioNome'
  ],
  usuarios: [
    'id', 'nome', 'login', 'perfil', 'cotaDiariaPontos',
    'cotaRestanteHoje', 'totalLancado', 'ativo', 'dataCadastro', 'passwordHash'
  ],
  transacoes: [
    'id', 'clienteId', 'clienteNome', 'clienteTelefone', 'usuarioId',
    'usuarioNome', 'numeroComanda', 'valorCompra', 'pontosGerados', 'status',
    'motivoPendente', 'aprovadoPorUsuarioId', 'aprovadoPorUsuarioNome',
    'aprovadoEm', 'rejeitadoPorUsuarioId', 'rejeitadoPorUsuarioNome',
    'motivoRejeicao', 'rejeitadoEm', 'motivoEstorno',
    'estornadoPorUsuarioId', 'estornadoPorUsuarioNome', 'estornadoEm', 'dataHora'
  ],
  resgates: [
    'id', 'clienteId', 'clienteNome', 'clienteTelefone', 'clienteEmail', 'usuarioId',
    'usuarioNome', 'cupomId', 'cupomTitulo', 'pontosUtilizados',
    'valorDescontoReais', 'codigoConfirmacao', 'codigoExpiraEm', 'status',
    'motivoEstorno', 'estornadoPorUsuarioId', 'estornadoPorUsuarioNome',
    'estornadoEm', 'dataHora'
  ],
  sms_logs: [
    'id', 'telefoneDestino', 'clienteNome', 'mensagem',
    'tipo', 'codigoRef', 'dataHora', 'lida'
  ],
  email_logs: [
    'id', 'emailDestino', 'clienteNome', 'assunto', 'tipo',
    'codigoRef', 'status', 'dataHora'
  ],
  auditoria: [
    'id', 'dataHora', 'acao', 'usuarioId', 'usuarioNome', 'usuarioPerfil',
    'detalhes', 'categoria', 'comandaRef', 'clienteRef', 'ip'
  ],
  configuracao: [
    'nomeEstabelecimento', 'taxaConversaoReais', 'valorResgatePontos',
    'valorResgateReais', 'cotaDiariaPadrao', 'expiracaoCodigoMinutos'
  ],
  cupons: [
    'id', 'titulo', 'descricao', 'pontosNecessarios',
    'valorDescontoReais', 'categoria', 'ativo', 'dataCadastro'
  ]
};

const initialConfig = {
  nomeEstabelecimento: 'El Buen Venezolano Guaro',
  taxaConversaoReais: 1,
  valorResgatePontos: 50,
  valorResgateReais: 10,
  cotaDiariaPadrao: 1000,
  expiracaoCodigoMinutos: 1
};

const initialCoupons = [
  {
    id: 'cup-1',
    titulo: 'R$ 10 OFF',
    descricao: 'Desconto de R$ 10,00 em qualquer pedido elegível',
    pontosNecessarios: 100,
    valorDescontoReais: 10,
    categoria: 'Fidelidade',
    ativo: true,
    dataCadastro: new Date().toISOString().slice(0, 10)
  },
  {
    id: 'cup-2',
    titulo: 'R$ 20 OFF',
    descricao: 'Desconto de R$ 20,00 em qualquer pedido elegível',
    pontosNecessarios: 180,
    valorDescontoReais: 20,
    categoria: 'Fidelidade',
    ativo: true,
    dataCadastro: new Date().toISOString().slice(0, 10)
  },
  {
    id: 'cup-3',
    titulo: 'R$ 30 OFF no Combo Gourmet',
    descricao: 'Desconto de R$ 30,00 válido para combos e hambúrgueres duplos',
    pontosNecessarios: 250,
    valorDescontoReais: 30,
    categoria: 'Combos',
    ativo: true,
    dataCadastro: new Date().toISOString().slice(0, 10)
  }
];

function requireEnvironment() {
  const required = [
    'GOOGLE_SHEETS_ID',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY'
  ];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) {
    throw new Error(`Variáveis ausentes no .env: ${missing.join(', ')}`);
  }
}

function normalizeHeaders(sheetTitle, existingHeaders) {
  const renamed = existingHeaders.map(header => {
    if (sheetTitle === 'auditoria' && header === 'data') return 'dataHora';
    return header;
  });
  const required = schemas[sheetTitle];
  return [...renamed, ...required.filter(header => !renamed.includes(header))];
}

async function configureSheet(doc, title) {
  const requiredHeaders = schemas[title];
  let sheet = doc.sheetsByTitle[title];

  if (!sheet) {
    sheet = await doc.addSheet({ title, headerValues: requiredHeaders });
    console.log(`CRIADA: ${title}`);
    return sheet;
  }

  let existingHeaders = [];
  try {
    await sheet.loadHeaderRow();
    existingHeaders = sheet.headerValues || [];
  } catch (error) {
    const emptyHeader = /header|row|values/i.test(error.message);
    if (!emptyHeader) throw error;
  }
  const finalHeaders = normalizeHeaders(title, existingHeaders);

  if (JSON.stringify(existingHeaders) !== JSON.stringify(finalHeaders)) {
    await sheet.setHeaderRow(finalHeaders);
    console.log(`ATUALIZADA: ${title} (${finalHeaders.length - existingHeaders.length} colunas adicionadas/corrigidas)`);
  } else {
    console.log(`OK: ${title}`);
  }

  return sheet;
}

async function main() {
  requireEnvironment();

  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID, auth);
  await doc.loadInfo();
  console.log(`Planilha: ${doc.title}`);

  const configuredSheets = {};
  for (const title of Object.keys(schemas)) {
    configuredSheets[title] = await configureSheet(doc, title);
  }

  const configSheet = configuredSheets.configuracao;
  const configRows = await configSheet.getRows({ limit: 1 });
  if (configRows.length === 0) {
    await configSheet.addRow(initialConfig);
    console.log('DADOS INICIAIS: configuração adicionada');
  } else {
    console.log('DADOS INICIAIS: configuração já existente, preservada');
  }

  const couponsSheet = configuredSheets.cupons;
  const couponRows = await couponsSheet.getRows({ limit: 1 });
  if (couponRows.length === 0) {
    await couponsSheet.addRows(initialCoupons);
    console.log('DADOS INICIAIS: cupons adicionados');
  } else {
    console.log('DADOS INICIAIS: cupons já existentes, preservados');
  }

  console.log('Configuração da planilha concluída com sucesso.');
}

main().catch(error => {
  console.error(`Falha ao configurar a planilha: ${error.message}`);
  process.exitCode = 1;
});
