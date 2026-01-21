const { Log } = require('../models');

// Middleware para registrar ações no sistema
const logAction = async (req, acao, entidade, entidadeId, dadosAnteriores = null, dadosNovos = null) => {
  try {
    await Log.create({
      usuario_id: req.userId || null,
      acao,
      entidade,
      entidade_id: entidadeId,
      dados_anteriores: dadosAnteriores,
      dados_novos: dadosNovos,
      ip: req.ip || req.connection?.remoteAddress || 'unknown'
    });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
};

// Middleware para log automático de requisições
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] ${logData.method} ${logData.url} ${logData.status} - ${logData.duration}`);
    }
  });

  next();
};

module.exports = { logAction, requestLogger };
