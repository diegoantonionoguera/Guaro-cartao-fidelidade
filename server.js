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
const sessionHours = 8;

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
    const [clients, users, transactions, redemptions, smsLogs, auditLogs, configRows] = await Promise.all([
      readSheet('clientes'), readSheet('usuarios'), readSheet('transacoes'),
      readSheet('resgates'), readSheet('sms_logs'), readSheet('auditoria'), readSheet('configuracao')
    ]);
    res.json({ clients, users: users.map(publicUser), transactions, redemptions, smsLogs, auditLogs, config: configRows[0] || {} });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: 'Não foi possível ler a planilha.' });
  }
});

app.post('/api/clients', requireAuth, async (req, res) => {
  const nome = cleanText(req.body?.nome, 100);
  const telefone = cleanText(req.body?.telefone, 20).replace(/[^\d+()-\s]/g, '');
  const cpf = cleanText(req.body?.cpf, 14).replace(/\D/g, '');
  if (nome.length < 2 || telefone.length < 8) return res.status(400).json({ error: 'Nome ou telefone inválido.' });

  const client = {
    id: crypto.randomUUID(), nome, telefone, cpf, saldoPontos: 0,
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
  const cpf = cleanText(req.body?.cpf, 14).replace(/\D/g, '');
  const saldoPontos = Number(req.body?.saldoPontos);

  if (!id || nome.length < 2 || telefone.length < 8) {
    return res.status(400).json({ error: 'Nome ou telefone inválido.' });
  }
  if (!Number.isInteger(saldoPontos) || saldoPontos < 0) {
    return res.status(400).json({ error: 'O saldo de pontos deve ser um número inteiro positivo.' });
  }

  const changes = { nome, telefone, cpf, saldoPontos };
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
