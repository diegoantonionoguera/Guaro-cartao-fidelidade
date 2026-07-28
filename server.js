import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { appendObject, deleteObjectById, isSheetsConfigured, readSheet, updateObjectById } from './src/services/googleSheets.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === 'production';
const sessions = new Map();
const loginAttempts = new Map();
const redemptionChallenges = new Map();
const sessionHours = 8;
const codeLifetimeMs = 60_000;
const entryWindowMs = 120_000;

if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
  throw new Error('Defina ADMIN_USER e ADMIN_PASSWORD antes de iniciar o servidor.');
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  });
  next();
});

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(item => {
    const [key, ...value] = item.trim().split('=');
    return [key, decodeURIComponent(value.join('='))];
  }));
}

function safeEqual(left, right) {
  const a = crypto.createHash('sha256').update(String(left)).digest();
  const b = crypto.createHash('sha256').update(String(right)).digest();
  return crypto.timingSafeEqual(a, b);
}

function requireSameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  const expected = `${req.protocol}://${req.get('host')}`;
  if (origin && origin !== expected) return res.status(403).json({ error: 'Origem não autorizada.' });
  next();
}

function requireAuth(req, res, next) {
  const token = cookies(req).fideli_session;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
  req.user = session.user;
  next();
}

function cleanText(value, max = 120) {
  return String(value ?? '').trim().slice(0, max);
}

function validEmail(value) {
  return /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i.test(value) && value.length <= 254;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(2, local.length - 2))}@${domain}`;
}

function clientLevel(totalPoints) {
  if (totalPoints >= 800) return 'VIP Gourmet';
  if (totalPoints >= 400) return 'Ouro';
  if (totalPoints >= 150) return 'Prata';
  return 'Bronze';
}

function codeDigest(redemptionId, code) {
  const secret = process.env.REDEMPTION_CODE_SECRET || process.env.ADMIN_PASSWORD;
  return crypto.createHmac('sha256', secret).update(`${redemptionId}:${code}`).digest('hex');
}

async function sendRedemptionEmail({ to, clientName, code, points, discount, establishment }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error('Serviço de e-mail não configurado no servidor.');
  }
  const safeName = escapeHtml(clientName);
  const safeEstablishment = escapeHtml(establishment);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'content-type': 'application/json',
      'user-agent': 'guaro-fidelidade/1.0'
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      reply_to: process.env.EMAIL_REPLY_TO || undefined,
      subject: `${code} é seu código de resgate — ${establishment}`,
      html: `
        <div style="background:#161616;padding:32px 16px;font-family:Arial,sans-serif;color:#fff">
          <div style="max-width:560px;margin:auto;background:#212121;border:1px solid #3b3b3b;border-radius:18px;overflow:hidden">
            <div style="height:6px;background:linear-gradient(90deg,#E32227,#FF7A00)"></div>
            <div style="padding:32px">
              <p style="margin:0 0 8px;color:#FFC529;font-size:12px;font-weight:700;text-transform:uppercase">Resgate de fidelidade</p>
              <h1 style="margin:0 0 16px;font-size:26px">Olá, ${safeName}!</h1>
              <p style="color:#d4d4d4;line-height:1.6">Use o código abaixo para confirmar seu desconto de <strong style="color:#fff">R$ ${Number(discount).toFixed(2)}</strong>, utilizando ${Number(points)} pontos.</p>
              <div style="margin:28px 0;padding:22px;text-align:center;background:#161616;border:1px solid #4a4a4a;border-radius:14px">
                <div style="font-size:38px;letter-spacing:10px;font-weight:800;color:#FFC529">${code}</div>
              </div>
              <p style="color:#fff;font-weight:700">Este código expira em 1 minuto.</p>
              <p style="color:#a3a3a3;font-size:13px;line-height:1.5">Se você não solicitou este resgate, ignore esta mensagem e não compartilhe o código.</p>
              <p style="margin:28px 0 0;color:#FF7A00;font-weight:700">${safeEstablishment}</p>
            </div>
          </div>
        </div>`
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Falha no envio do e-mail (${response.status}): ${detail.slice(0, 180)}`);
  }
  return response.json();
}

function requireManager(req, res, next) {
  if (req.user?.perfil !== 'gerente') {
    return res.status(403).json({ error: 'Apenas gerentes podem realizar esta ação.' });
  }
  next();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const [algorithm, salt, expectedHex] = String(storedHash || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function publicUser(user) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

app.use('/api', requireSameOrigin);

app.post('/api/auth/login', async (req, res) => {
  const key = req.ip;
  const attempt = loginAttempts.get(key) || { count: 0, blockedUntil: 0 };
  if (attempt.blockedUntil > Date.now()) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  const username = cleanText(req.body?.username, 80);
  const password = String(req.body?.password || '');
  let user = null;

  if (safeEqual(username, process.env.ADMIN_USER) && safeEqual(password, process.env.ADMIN_PASSWORD)) {
    user = { id: 'admin', nome: 'Administrador', login: username, perfil: 'gerente', cotaDiariaPontos: 999999, ativo: true };
  } else if (isSheetsConfigured()) {
    try {
      const users = await readSheet('usuarios');
      const found = users.find(item => (
        String(item.login || '').toLowerCase() === username.toLowerCase() &&
        item.ativo !== false
      ));
      if (found && verifyPassword(password, found.passwordHash)) user = publicUser(found);
    } catch (error) {
      console.error('Falha ao consultar usuários:', error);
      return res.status(502).json({ error: 'Não foi possível consultar os usuários.' });
    }
  }

  if (!user) {
    attempt.count += 1;
    if (attempt.count >= 5) {
      attempt.count = 0;
      attempt.blockedUntil = Date.now() + 15 * 60_000;
    }
    loginAttempts.set(key, attempt);
    return res.status(401).json({ error: 'Login ou senha incorretos.' });
  }

  loginAttempts.delete(key);
  const token = crypto.randomBytes(32).toString('base64url');
  sessions.set(token, { user, expiresAt: Date.now() + sessionHours * 3600_000 });
  res.setHeader('Set-Cookie', `fideli_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionHours * 3600}${production ? '; Secure' : ''}`);
  res.json({ user });
});

app.get('/api/auth/session', requireAuth, (req, res) => res.json({ user: req.user }));

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = cookies(req).fideli_session;
  sessions.delete(token);
  res.setHeader('Set-Cookie', `fideli_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${production ? '; Secure' : ''}`);
  res.status(204).end();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', storage: isSheetsConfigured() ? 'google_sheets' : 'not_configured' });
});

app.get('/api/state', requireAuth, async (_req, res) => {
  if (!isSheetsConfigured()) return res.status(503).json({ error: 'Planilha ainda não configurada.' });
  try {
    const [clients, users, coupons, transactions, redemptions, smsLogs, auditLogs, configRows] = await Promise.all([
      readSheet('clientes'), readSheet('usuarios'), readSheet('cupons'),
      readSheet('transacoes'), readSheet('resgates'), readSheet('sms_logs'),
      readSheet('auditoria'), readSheet('configuracao')
    ]);
    res.json({ clients, users: users.map(publicUser), coupons, transactions, redemptions, smsLogs, auditLogs, config: configRows[0] || {} });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível ler a planilha.' });
  }
});

app.post('/api/clients', requireAuth, async (req, res) => {
  const nome = cleanText(req.body?.nome, 100);
  const telefone = cleanText(req.body?.telefone, 20).replace(/[^\d+()-\s]/g, '');
  const email = cleanText(req.body?.email, 254).toLowerCase();
  const cpf = cleanText(req.body?.cpf, 14).replace(/\D/g, '');
  if (nome.length < 2 || telefone.length < 8 || !validEmail(email)) return res.status(400).json({ error: 'Nome, telefone ou e-mail inválido.' });

  const client = {
    id: crypto.randomUUID(), nome, telefone, email, cpf, saldoPontos: 0,
    totalPontosAcumulados: 0, totalResgates: 0, totalGastoHistorico: 0,
    nivel: 'Bronze', dataCadastro: new Date().toISOString().slice(0, 10)
  };
  try {
    await appendObject('clientes', client);
    await appendObject('auditoria', {
      id: crypto.randomUUID(), dataHora: new Date().toISOString(), acao: 'cadastro_cliente',
      usuarioNome: req.user.nome, detalhes: `Cliente cadastrado: ${nome}`, categoria: 'CLIENTES'
    });
    res.status(201).json({ client });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível gravar na planilha.' });
  }
});

app.put('/api/clients/:id', requireAuth, async (req, res) => {
  const id = cleanText(req.params.id, 100);
  const nome = cleanText(req.body?.nome, 100);
  const telefone = cleanText(req.body?.telefone, 20).replace(/[^\d+()-\s]/g, '');
  const email = cleanText(req.body?.email, 254).toLowerCase();
  const cpf = cleanText(req.body?.cpf, 14).replace(/\D/g, '');
  const protectedPointFields = ['saldoPontos', 'totalPontosAcumulados', 'totalResgates', 'totalGastoHistorico', 'nivel'];
  if (protectedPointFields.some(field => Object.prototype.hasOwnProperty.call(req.body || {}, field))) {
    return res.status(403).json({
      error: 'Pontos e totais não podem ser editados manualmente. Use compra, resgate ou estorno.'
    });
  }

  if (!id || nome.length < 2 || telefone.length < 8 || !validEmail(email)) {
    return res.status(400).json({ error: 'Nome, telefone ou e-mail inválido.' });
  }
  const changes = { nome, telefone, email, cpf };
  try {
    const updated = await updateObjectById('clientes', id, changes);
    if (!updated) return res.status(404).json({ error: 'Cliente não encontrado na planilha.' });

    await appendObject('auditoria', {
      id: crypto.randomUUID(),
      dataHora: new Date().toISOString(),
      acao: 'edicao_cliente',
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      usuarioPerfil: req.user.perfil,
      detalhes: `Cliente atualizado: ${nome}`,
      categoria: 'CLIENTES',
      clienteRef: telefone,
      ip: req.ip
    });
    res.json({ client: { id, ...changes } });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível atualizar o cliente na planilha.' });
  }
});

app.delete('/api/clients/:id', requireAuth, requireManager, async (req, res) => {
  const id = cleanText(req.params.id, 100);
  try {
    const clients = await readSheet('clientes');
    const client = clients.find(item => String(item.id) === id);
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado na planilha.' });
    const removed = await deleteObjectById('clientes', id);
    if (!removed) return res.status(404).json({ error: 'Cliente não encontrado na planilha.' });
    await appendObject('auditoria', {
      id: crypto.randomUUID(), dataHora: new Date().toISOString(), acao: 'exclusao_cliente',
      usuarioId: req.user.id, usuarioNome: req.user.nome, usuarioPerfil: req.user.perfil,
      detalhes: `Cliente excluído: ${client.nome}`, categoria: 'CLIENTES',
      clienteRef: client.telefone, ip: req.ip
    });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível excluir o cliente da planilha.' });
  }
});

app.post('/api/coupons', requireAuth, requireManager, async (req, res) => {
  const titulo = cleanText(req.body?.titulo, 120);
  const descricao = cleanText(req.body?.descricao, 300);
  const pontosNecessarios = Number(req.body?.pontosNecessarios);
  const valorDescontoReais = Number(req.body?.valorDescontoReais);
  const ativo = req.body?.ativo !== false;
  if (titulo.length < 2 || descricao.length < 2 || !Number.isInteger(pontosNecessarios) || pontosNecessarios <= 0 || !Number.isFinite(valorDescontoReais) || valorDescontoReais <= 0) {
    return res.status(400).json({ error: 'Preencha corretamente o título, descrição, pontos e desconto.' });
  }
  const coupon = {
    id: crypto.randomUUID(), titulo, descricao, pontosNecessarios,
    valorDescontoReais, categoria: cleanText(req.body?.categoria, 60) || 'Fidelidade',
    ativo, dataCadastro: new Date().toISOString().slice(0, 10)
  };
  try {
    await appendObject('cupons', coupon);
    await appendObject('auditoria', {
      id: crypto.randomUUID(), dataHora: new Date().toISOString(), acao: 'cadastro_cupom',
      usuarioId: req.user.id, usuarioNome: req.user.nome, usuarioPerfil: req.user.perfil,
      detalhes: `Cupom criado: ${titulo}`, categoria: 'CUPONS', ip: req.ip
    });
    res.status(201).json({ coupon });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível salvar o cupom na planilha.' });
  }
});

app.put('/api/coupons/:id', requireAuth, requireManager, async (req, res) => {
  const id = cleanText(req.params.id, 100);
  const titulo = cleanText(req.body?.titulo, 120);
  const descricao = cleanText(req.body?.descricao, 300);
  const pontosNecessarios = Number(req.body?.pontosNecessarios);
  const valorDescontoReais = Number(req.body?.valorDescontoReais);
  const ativo = req.body?.ativo !== false;
  if (!id || titulo.length < 2 || descricao.length < 2 || !Number.isInteger(pontosNecessarios) || pontosNecessarios <= 0 || !Number.isFinite(valorDescontoReais) || valorDescontoReais <= 0) {
    return res.status(400).json({ error: 'Dados do cupom inválidos.' });
  }
  const changes = { titulo, descricao, pontosNecessarios, valorDescontoReais, ativo };
  try {
    const updated = await updateObjectById('cupons', id, changes);
    if (!updated) return res.status(404).json({ error: 'Cupom não encontrado na planilha.' });
    res.json({ coupon: { id, ...changes } });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível atualizar o cupom.' });
  }
});

app.delete('/api/coupons/:id', requireAuth, requireManager, async (req, res) => {
  const id = cleanText(req.params.id, 100);
  try {
    const removed = await deleteObjectById('cupons', id);
    if (!removed) return res.status(404).json({ error: 'Cupom não encontrado.' });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível excluir o cupom.' });
  }
});

app.post('/api/transactions', requireAuth, async (req, res) => {
  const clientId = cleanText(req.body?.clientId, 100);
  const numeroComanda = cleanText(req.body?.numeroComanda, 60).toUpperCase();
  const valorCompra = Number(req.body?.valorCompra);
  if (!clientId || numeroComanda.length < 2 || !Number.isFinite(valorCompra) || valorCompra <= 0) {
    return res.status(400).json({ error: 'Cliente, comanda ou valor da compra inválido.' });
  }

  try {
    const [clients, transactions, configRows] = await Promise.all([
      readSheet('clientes'), readSheet('transacoes'), readSheet('configuracao')
    ]);
    const client = clients.find(item => String(item.id) === clientId);
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
    const duplicate = transactions.some(item => (
      String(item.numeroComanda || '').toUpperCase() === numeroComanda &&
      !['rejeitado', 'estornado'].includes(String(item.status))
    ));
    if (duplicate) return res.status(409).json({ error: 'Esta comanda já foi lançada.' });

    const conversionRate = Number(configRows[0]?.taxaConversaoReais || 1);
    const pontosGerados = Math.floor(valorCompra * conversionRate);
    if (pontosGerados <= 0) return res.status(400).json({ error: 'O valor informado não gera pontos.' });

    const today = new Date().toISOString().slice(0, 10);
    const usedToday = transactions
      .filter(item => (
        String(item.usuarioId) === String(req.user.id) &&
        item.status === 'aprovado' &&
        String(item.dataHora || '').slice(0, 10) === today
      ))
      .reduce((total, item) => total + Number(item.pontosGerados || 0), 0);
    const quota = Number(req.user.cotaDiariaPontos ?? configRows[0]?.cotaDiariaPadrao ?? 0);
    const remainingQuota = Math.max(0, quota - usedToday);
    const status = req.user.perfil === 'gerente' || pontosGerados <= remainingQuota ? 'aprovado' : 'pendente';

    const transaction = {
      id: crypto.randomUUID(),
      clienteId: client.id,
      clienteNome: client.nome,
      clienteTelefone: client.telefone,
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      numeroComanda,
      valorCompra: Number(valorCompra.toFixed(2)),
      pontosGerados,
      status,
      motivoPendente: status === 'pendente' ? `Excede a cota restante de ${remainingQuota} pontos` : '',
      dataHora: new Date().toISOString()
    };
    await appendObject('transacoes', transaction);

    let clientChanges = null;
    if (status === 'aprovado') {
      const totalPontosAcumulados = Number(client.totalPontosAcumulados || 0) + pontosGerados;
      clientChanges = {
        saldoPontos: Number(client.saldoPontos || 0) + pontosGerados,
        totalPontosAcumulados,
        totalGastoHistorico: Number((Number(client.totalGastoHistorico || 0) + valorCompra).toFixed(2)),
        nivel: clientLevel(totalPontosAcumulados)
      };
      await updateObjectById('clientes', client.id, clientChanges);
    }

    await appendObject('auditoria', {
      id: crypto.randomUUID(), dataHora: new Date().toISOString(), acao: 'lancamento_pontos',
      usuarioId: req.user.id, usuarioNome: req.user.nome, usuarioPerfil: req.user.perfil,
      detalhes: `${numeroComanda}: R$ ${valorCompra.toFixed(2)}, ${pontosGerados} pontos, status ${status}`,
      categoria: 'PONTOS', comandaRef: numeroComanda, clienteRef: client.telefone, ip: req.ip
    });
    res.status(201).json({
      transaction,
      client: clientChanges ? { id: client.id, ...clientChanges } : null,
      remainingQuota
    });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível registrar a compra e os pontos na planilha.' });
  }
});

app.post('/api/transactions/:id/approve', requireAuth, requireManager, async (req, res) => {
  const id = cleanText(req.params.id, 100);
  try {
    const [transactions, clients] = await Promise.all([readSheet('transacoes'), readSheet('clientes')]);
    const transaction = transactions.find(item => String(item.id) === id);
    if (!transaction || transaction.status !== 'pendente') {
      return res.status(404).json({ error: 'Lançamento pendente não encontrado.' });
    }
    const client = clients.find(item => String(item.id) === String(transaction.clienteId));
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
    const points = Number(transaction.pontosGerados || 0);
    const amount = Number(transaction.valorCompra || 0);
    const totalPontosAcumulados = Number(client.totalPontosAcumulados || 0) + points;
    const clientChanges = {
      saldoPontos: Number(client.saldoPontos || 0) + points,
      totalPontosAcumulados,
      totalGastoHistorico: Number((Number(client.totalGastoHistorico || 0) + amount).toFixed(2)),
      nivel: clientLevel(totalPontosAcumulados)
    };
    const transactionChanges = {
      status: 'aprovado',
      aprovadoPorUsuarioId: req.user.id,
      aprovadoPorUsuarioNome: req.user.nome,
      aprovadoEm: new Date().toISOString()
    };
    await updateObjectById('clientes', client.id, clientChanges);
    await updateObjectById('transacoes', id, transactionChanges);
    await appendObject('auditoria', {
      id: crypto.randomUUID(), dataHora: new Date().toISOString(), acao: 'aprovacao_excedente',
      usuarioId: req.user.id, usuarioNome: req.user.nome, usuarioPerfil: req.user.perfil,
      detalhes: `Aprovados ${points} pontos da comanda ${transaction.numeroComanda}`,
      categoria: 'PONTOS', comandaRef: transaction.numeroComanda,
      clienteRef: client.telefone, ip: req.ip
    });
    res.json({
      transaction: { id, ...transactionChanges },
      client: { id: client.id, ...clientChanges }
    });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível aprovar o lançamento.' });
  }
});

app.post('/api/transactions/:id/reject', requireAuth, requireManager, async (req, res) => {
  const id = cleanText(req.params.id, 100);
  const motivo = cleanText(req.body?.motivo, 300);
  if (motivo.length < 3) return res.status(400).json({ error: 'Informe o motivo da rejeição.' });
  try {
    const transactions = await readSheet('transacoes');
    const transaction = transactions.find(item => String(item.id) === id);
    if (!transaction || transaction.status !== 'pendente') {
      return res.status(404).json({ error: 'Lançamento pendente não encontrado.' });
    }
    const updated = await updateObjectById('transacoes', id, {
      status: 'rejeitado',
      rejeitadoPorUsuarioId: req.user.id,
      rejeitadoPorUsuarioNome: req.user.nome,
      motivoRejeicao: motivo,
      rejeitadoEm: new Date().toISOString()
    });
    if (!updated) return res.status(404).json({ error: 'Lançamento não encontrado.' });
    await appendObject('auditoria', {
      id: crypto.randomUUID(), dataHora: new Date().toISOString(), acao: 'rejeicao_excedente',
      usuarioId: req.user.id, usuarioNome: req.user.nome, usuarioPerfil: req.user.perfil,
      detalhes: `Lançamento rejeitado: ${motivo}`, categoria: 'PONTOS',
      comandaRef: transaction.numeroComanda, clienteRef: transaction.clienteTelefone, ip: req.ip
    });
    res.json({ transaction: { id, status: 'rejeitado', motivoRejeicao: motivo } });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível rejeitar o lançamento.' });
  }
});

app.post('/api/transactions/:id/reverse', requireAuth, requireManager, async (req, res) => {
  const id = cleanText(req.params.id, 100);
  const motivo = cleanText(req.body?.motivo, 300);
  if (motivo.length < 3) return res.status(400).json({ error: 'Informe o motivo do estorno.' });
  try {
    const [transactions, clients] = await Promise.all([readSheet('transacoes'), readSheet('clientes')]);
    const transaction = transactions.find(item => String(item.id) === id);
    if (!transaction || transaction.status !== 'aprovado') {
      return res.status(404).json({ error: 'Lançamento aprovado não encontrado.' });
    }
    const client = clients.find(item => String(item.id) === String(transaction.clienteId));
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
    const points = Number(transaction.pontosGerados || 0);
    const amount = Number(transaction.valorCompra || 0);
    if (Number(client.saldoPontos || 0) < points) {
      return res.status(409).json({
        error: 'O cliente já utilizou parte destes pontos. Estorne primeiro os resgates relacionados.'
      });
    }
    const totalPontosAcumulados = Math.max(0, Number(client.totalPontosAcumulados || 0) - points);
    const clientChanges = {
      saldoPontos: Math.max(0, Number(client.saldoPontos || 0) - points),
      totalPontosAcumulados,
      totalGastoHistorico: Number(Math.max(0, Number(client.totalGastoHistorico || 0) - amount).toFixed(2)),
      nivel: clientLevel(totalPontosAcumulados)
    };
    const transactionChanges = {
      status: 'estornado',
      motivoEstorno: motivo,
      estornadoPorUsuarioId: req.user.id,
      estornadoPorUsuarioNome: req.user.nome,
      estornadoEm: new Date().toISOString()
    };
    await updateObjectById('clientes', client.id, clientChanges);
    await updateObjectById('transacoes', id, transactionChanges);
    await appendObject('auditoria', {
      id: crypto.randomUUID(), dataHora: new Date().toISOString(), acao: 'estorno_pontos',
      usuarioId: req.user.id, usuarioNome: req.user.nome, usuarioPerfil: req.user.perfil,
      detalhes: `Estornados ${points} pontos e R$ ${amount.toFixed(2)} da comanda ${transaction.numeroComanda}. Motivo: ${motivo}`,
      categoria: 'PONTOS', comandaRef: transaction.numeroComanda,
      clienteRef: client.telefone, ip: req.ip
    });
    res.json({
      transaction: { id, ...transactionChanges },
      client: { id: client.id, ...clientChanges }
    });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível estornar o lançamento.' });
  }
});

app.post('/api/redemptions/request', requireAuth, async (req, res) => {
  const clientId = cleanText(req.body?.clientId, 100);
  const couponId = cleanText(req.body?.couponId, 100);
  if (!clientId) {
    return res.status(400).json({ error: 'Dados do resgate inválidos.' });
  }

  try {
    const [clients, configRows, coupons] = await Promise.all([
      readSheet('clientes'), readSheet('configuracao'), readSheet('cupons')
    ]);
    const client = clients.find(item => String(item.id) === clientId);
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
    if (!validEmail(String(client.email || ''))) {
      return res.status(400).json({ error: 'Cadastre um e-mail válido para o cliente antes do resgate.' });
    }
    const config = configRows[0] || {};
    const coupon = couponId ? coupons.find(item => String(item.id) === couponId && item.ativo !== false) : null;
    if (couponId && !coupon) return res.status(400).json({ error: 'Cupom inválido ou inativo.' });
    const points = Number(coupon?.pontosNecessarios || config.valorResgatePontos);
    const discount = Number(coupon?.valorDescontoReais || config.valorResgateReais);
    const couponTitle = cleanText(coupon?.titulo, 120);
    if (!Number.isInteger(points) || points <= 0 || !Number.isFinite(discount) || discount <= 0) {
      return res.status(400).json({ error: 'Configuração de resgate inválida.' });
    }
    if (Number(client.saldoPontos || 0) < points) {
      return res.status(400).json({ error: 'Saldo de pontos insuficiente.' });
    }

    const redemptionId = crypto.randomUUID();
    const code = crypto.randomInt(100000, 1000000).toString();
    const now = Date.now();
    const expiresAt = new Date(now + codeLifetimeMs).toISOString();
    const entryWindowEndsAt = new Date(now + entryWindowMs).toISOString();
    const establishment = config.nomeEstabelecimento || 'El Buen Venezolano Guaro';

    await sendRedemptionEmail({
      to: client.email, clientName: client.nome, code,
      points, discount, establishment
    });

    const redemption = {
      id: redemptionId, clienteId: client.id, clienteNome: client.nome,
      clienteTelefone: client.telefone, clienteEmail: client.email,
      usuarioId: req.user.id, usuarioNome: req.user.nome,
      cupomId: couponId, cupomTitulo: couponTitle,
      pontosUtilizados: points, valorDescontoReais: discount,
      codigoConfirmacao: 'PROTEGIDO', codigoExpiraEm: expiresAt,
      status: 'pendente', dataHora: new Date(now).toISOString()
    };
    await appendObject('resgates', redemption);
    try {
      await appendObject('email_logs', {
        id: crypto.randomUUID(), emailDestino: client.email, clienteNome: client.nome,
        assunto: `Código de resgate — ${establishment}`, tipo: 'codigo_resgate',
        codigoRef: redemptionId, status: 'enviado', dataHora: new Date(now).toISOString()
      });
    } catch (logError) {
      console.warn('E-mail enviado, mas a aba email_logs ainda não está disponível:', logError.message);
    }
    redemptionChallenges.set(redemptionId, {
      digest: codeDigest(redemptionId, code),
      clientId: client.id,
      userId: req.user.id,
      points,
      discount,
      expiresAt: now + codeLifetimeMs,
      entryWindowEndsAt: now + entryWindowMs,
      attempts: 0
    });
    res.status(201).json({
      redemption: publicUser(redemption),
      maskedEmail: maskEmail(client.email),
      expiresAt,
      entryWindowEndsAt
    });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: error.message || 'Não foi possível enviar o código por e-mail.' });
  }
});

app.post('/api/redemptions/:id/confirm', requireAuth, async (req, res) => {
  const redemptionId = cleanText(req.params.id, 100);
  const code = cleanText(req.body?.code, 6).replace(/\D/g, '');
  const challenge = redemptionChallenges.get(redemptionId);
  if (!challenge || challenge.userId !== req.user.id) {
    return res.status(404).json({ error: 'Solicitação de resgate não encontrada. Gere um novo código.' });
  }
  if (Date.now() > challenge.entryWindowEndsAt) {
    redemptionChallenges.delete(redemptionId);
    await updateObjectById('resgates', redemptionId, { status: 'expirado' }).catch(() => {});
    return res.status(410).json({ error: 'O tempo de preenchimento terminou. Inicie um novo resgate.' });
  }
  if (Date.now() > challenge.expiresAt) {
    await updateObjectById('resgates', redemptionId, { status: 'expirado' }).catch(() => {});
    return res.status(410).json({ error: 'O código expirou após 1 minuto. Solicite um novo código.' });
  }
  challenge.attempts += 1;
  if (challenge.attempts > 5) {
    redemptionChallenges.delete(redemptionId);
    await updateObjectById('resgates', redemptionId, { status: 'bloqueado' }).catch(() => {});
    return res.status(429).json({ error: 'Muitas tentativas incorretas. Inicie um novo resgate.' });
  }
  const supplied = codeDigest(redemptionId, code);
  if (!safeEqual(supplied, challenge.digest)) {
    return res.status(400).json({ error: 'Código incorreto. Verifique o e-mail e tente novamente.' });
  }

  try {
    const clients = await readSheet('clientes');
    const client = clients.find(item => String(item.id) === challenge.clientId);
    if (!client || Number(client.saldoPontos || 0) < challenge.points) {
      return res.status(400).json({ error: 'Saldo insuficiente para concluir o resgate.' });
    }
    const clientChanges = {
      saldoPontos: Number(client.saldoPontos) - challenge.points,
      totalResgates: Number(client.totalResgates || 0) + challenge.points
    };
    await updateObjectById('clientes', client.id, clientChanges);
    await updateObjectById('resgates', redemptionId, {
      status: 'confirmado',
      confirmadoEm: new Date().toISOString()
    });
    await appendObject('auditoria', {
      id: crypto.randomUUID(), dataHora: new Date().toISOString(), acao: 'resgate_pontos',
      usuarioId: req.user.id, usuarioNome: req.user.nome, usuarioPerfil: req.user.perfil,
      detalhes: `Resgate confirmado por e-mail: ${challenge.points} pontos`,
      categoria: 'RESGATES', clienteRef: client.email, ip: req.ip
    });
    redemptionChallenges.delete(redemptionId);
    res.json({ client: { id: client.id, ...clientChanges }, status: 'confirmado' });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível concluir o resgate na planilha.' });
  }
});

app.post('/api/redemptions/:id/reverse', requireAuth, requireManager, async (req, res) => {
  const id = cleanText(req.params.id, 100);
  const motivo = cleanText(req.body?.motivo, 300);
  if (motivo.length < 3) return res.status(400).json({ error: 'Informe o motivo do estorno.' });
  try {
    const [redemptions, clients] = await Promise.all([readSheet('resgates'), readSheet('clientes')]);
    const redemption = redemptions.find(item => String(item.id) === id);
    if (!redemption || redemption.status !== 'confirmado') {
      return res.status(404).json({ error: 'Resgate confirmado não encontrado.' });
    }
    const client = clients.find(item => String(item.id) === String(redemption.clienteId));
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
    const points = Number(redemption.pontosUtilizados || 0);
    const clientChanges = {
      saldoPontos: Number(client.saldoPontos || 0) + points,
      totalResgates: Math.max(0, Number(client.totalResgates || 0) - points)
    };
    const redemptionChanges = {
      status: 'estornado',
      motivoEstorno: motivo,
      estornadoPorUsuarioId: req.user.id,
      estornadoPorUsuarioNome: req.user.nome,
      estornadoEm: new Date().toISOString()
    };
    await updateObjectById('clientes', client.id, clientChanges);
    await updateObjectById('resgates', id, redemptionChanges);
    await appendObject('auditoria', {
      id: crypto.randomUUID(), dataHora: new Date().toISOString(), acao: 'estorno_resgate',
      usuarioId: req.user.id, usuarioNome: req.user.nome, usuarioPerfil: req.user.perfil,
      detalhes: `Devolvidos ${points} pontos ao cliente. Motivo: ${motivo}`,
      categoria: 'RESGATES', clienteRef: client.email || client.telefone, ip: req.ip
    });
    res.json({
      redemption: { id, ...redemptionChanges },
      client: { id: client.id, ...clientChanges }
    });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível estornar o resgate.' });
  }
});

app.post('/api/users', requireAuth, requireManager, async (req, res) => {
  const nome = cleanText(req.body?.nome, 100);
  const login = cleanText(req.body?.login, 80).toLowerCase();
  const perfil = req.body?.perfil === 'gerente' ? 'gerente' : 'atendente';
  const password = String(req.body?.password || '');
  const cotaDiariaPontos = Number(req.body?.cotaDiariaPontos);
  if (nome.length < 2 || login.length < 3 || password.length < 8) {
    return res.status(400).json({ error: 'Informe nome, login e uma senha com pelo menos 8 caracteres.' });
  }
  if (!Number.isInteger(cotaDiariaPontos) || cotaDiariaPontos < 0) {
    return res.status(400).json({ error: 'Cota diária inválida.' });
  }
  try {
    const users = await readSheet('usuarios');
    if (users.some(item => String(item.login || '').toLowerCase() === login)) {
      return res.status(409).json({ error: 'Este login já está em uso.' });
    }
    const user = {
      id: crypto.randomUUID(), nome, login, perfil, cotaDiariaPontos,
      cotaRestanteHoje: cotaDiariaPontos, totalLancado: 0, ativo: true,
      dataCadastro: new Date().toISOString().slice(0, 10),
      passwordHash: hashPassword(password)
    };
    await appendObject('usuarios', user);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível cadastrar o usuário.' });
  }
});

app.put('/api/users/:id', requireAuth, requireManager, async (req, res) => {
  const id = cleanText(req.params.id, 100);
  const nome = cleanText(req.body?.nome, 100);
  const login = cleanText(req.body?.login, 80).toLowerCase();
  const perfil = req.body?.perfil === 'gerente' ? 'gerente' : 'atendente';
  const password = String(req.body?.password || '');
  const cotaDiariaPontos = Number(req.body?.cotaDiariaPontos);
  if (nome.length < 2 || login.length < 3 || (password && password.length < 8)) {
    return res.status(400).json({ error: 'Dados inválidos. A nova senha deve ter pelo menos 8 caracteres.' });
  }
  if (!Number.isInteger(cotaDiariaPontos) || cotaDiariaPontos < 0) {
    return res.status(400).json({ error: 'Cota diária inválida.' });
  }
  try {
    const users = await readSheet('usuarios');
    if (users.some(item => String(item.id) !== id && String(item.login || '').toLowerCase() === login)) {
      return res.status(409).json({ error: 'Este login já está em uso.' });
    }
    const changes = { nome, login, perfil, cotaDiariaPontos };
    if (password) changes.passwordHash = hashPassword(password);
    const updated = await updateObjectById('usuarios', id, changes);
    if (!updated) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ user: publicUser({ id, ...changes }) });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível atualizar o usuário.' });
  }
});

app.delete('/api/users/:id', requireAuth, requireManager, async (req, res) => {
  const id = cleanText(req.params.id, 100);
  if (id === req.user.id) return res.status(400).json({ error: 'Você não pode excluir o próprio acesso.' });
  try {
    const removed = await deleteObjectById('usuarios', id);
    if (!removed) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível excluir o usuário.' });
  }
});

if (!production) {
  const vite = await createViteServer({
    configLoader: 'runner',
    server: { middlewareMode: true, hmr: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(port, '0.0.0.0', () => console.log(`El Buen Venezolano Guaro em http://localhost:${port}`));
