require('dotenv').config();
const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');

async function testarConexao() {
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : '';

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEETS_ID,
      serviceAccountAuth
    );

    console.log('Conectando à planilha...');
    await doc.loadInfo();
    console.log(`Sucesso! Conectado à planilha: "${doc.title}"`);

    const sheetAuditoria = doc.sheetsByTitle.auditoria;

    if (!sheetAuditoria) {
      throw new Error(
        'A aba "auditoria" não foi encontrada. Verifique o nome das abas.'
      );
    }

    console.log('Tentando gravar um registro de teste em "auditoria"...');
    await sheetAuditoria.addRow({
      id: `teste-${Date.now()}`,
      dataHora: new Date().toISOString(),
      acao: 'TESTE_CONEXAO',
      usuarioNome: 'Sistema',
      usuarioPerfil: 'sistema',
      detalhes: 'Teste de leitura e escrita realizado com sucesso pelo backend Node.js',
      categoria: 'SISTEMA'
    });

    console.log('Leitura e gravação concluídas com sucesso!');
  } catch (error) {
    console.error('Erro durante o teste:', error.message);
    process.exitCode = 1;
  }
}

testarConexao();
