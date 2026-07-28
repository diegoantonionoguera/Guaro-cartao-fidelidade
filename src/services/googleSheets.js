import crypto from 'node:crypto';

const API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

let cachedToken = null;

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function getConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error('Google Sheets não configurado. Consulte o arquivo .env.example.');
  }

  return { spreadsheetId, clientEmail, privateKey };
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const { clientEmail, privateKey } = getConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = encode(JSON.stringify({
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600
  }));
  const unsigned = `${header}.${claim}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey).toString('base64url');

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`
    })
  });

  if (!response.ok) throw new Error('Falha ao autenticar a conta de serviço do Google.');
  const data = await response.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function request(path, options = {}) {
  const { spreadsheetId } = getConfig();
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}/${spreadsheetId}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Sheets respondeu ${response.status}: ${detail.slice(0, 300)}`);
  }
  return response.json();
}

function rowsToObjects(values = []) {
  const [headers = [], ...rows] = values;
  return rows.map(row => Object.fromEntries(headers.map((key, index) => {
    const value = row[index] ?? '';
    if (value === 'true') return [key, true];
    if (value === 'false') return [key, false];
    if (value !== '' && Number.isFinite(Number(value))) return [key, Number(value)];
    return [key, value];
  })));
}

export async function readSheet(sheetName) {
  const range = encodeURIComponent(`'${sheetName}'!A:ZZ`);
  const data = await request(`/values/${range}`);
  return rowsToObjects(data.values);
}

export async function appendObject(sheetName, object) {
  const existing = await request(`/values/${encodeURIComponent(`'${sheetName}'!1:1`)}`);
  const headers = existing.values?.[0] || Object.keys(object);

  if (!existing.values?.length) {
    await request(`/values/${encodeURIComponent(`'${sheetName}'!A1`)}?valueInputOption=RAW`, {
      method: 'PUT',
      body: JSON.stringify({ values: [headers] })
    });
  }

  await request(`/values/${encodeURIComponent(`'${sheetName}'!A:ZZ`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values: [headers.map(key => object[key] ?? '')] })
  });
}

export function isSheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEETS_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  );
}
