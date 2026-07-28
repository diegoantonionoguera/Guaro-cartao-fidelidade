function formatError(error) {
  if (error instanceof Error) {
    const details = error.stack || `${error.name}: ${error.message}`;
    const cause = error.cause
      ? `\nCAUSA: ${error.cause instanceof Error ? error.cause.stack || error.cause.message : String(error.cause)}`
      : '';

    return `${details}${cause}`;
  }

  return String(error);
}

let fatalErrorReported = false;

function reportFatalError(context, error) {
  if (fatalErrorReported) return;
  fatalErrorReported = true;

  console.error(`[BOOT_FATAL] ${context}`);
  console.error('ERRO DETALHADO NA INICIALIZAÇÃO:', formatError(error));
  process.exitCode = 1;
}

process.on('uncaughtException', (error) => {
  reportFatalError('Exceção não capturada.', error);
});

process.on('unhandledRejection', (reason) => {
  reportFatalError('Promise rejeitada sem tratamento.', reason);
});

try {
  await import('./server.js');
} catch (error) {
  reportFatalError('Falha ao carregar ou iniciar server.js.', error);
}
