import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { appendObject, isSheetsConfigured, readSheet } from './src/services/googleSheets.js';

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

app.use('/api', requireSameOrigin);

app.post('/api/auth/login', (req, res) => {
  const key = req.ip;
  const attempt = loginAttempts.get(key) || { count: 0, blockedUntil: 0 };
  if (attempt.blockedUntil > Date.now()) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  const validUser = safeEqual(req.body?.username, process.env.ADMIN_USER);
  const validPassword = safeEqual(req.body?.password, process.env.ADMIN_PASSWORD);
  const valid = validUser && validPassword;
  if (!valid) {
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
  const user = { id: 'admin', nome: 'Administrador', perfil: 'gerente' };
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
    res.json({ clients, users, transactions, redemptions, smsLogs, auditLogs, config: configRows[0] || {} });
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
