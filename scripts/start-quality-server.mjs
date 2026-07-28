process.env.NODE_ENV = 'development';
process.env.HOST = '127.0.0.1';
process.env.PORT = process.env.QUALITY_PORT || '4176';
process.env.ADMIN_USER = 'quality-admin';
process.env.ADMIN_PASSWORD = 'Quality-Only-Password-2026!';
process.env.EMAIL_FROM = 'Quality Check <quality@example.test>';
process.env.REDEMPTION_CODE_SECRET = 'quality-only-redemption-secret-2026';

process.env.GOOGLE_SHEETS_ID = '';
process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = '';
process.env.GOOGLE_PRIVATE_KEY = '';
process.env.RESEND_API_KEY = '';

await import('../start.js');
