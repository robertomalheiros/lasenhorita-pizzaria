require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { sequelize, testConnection } = require('./config/database');
const { requestLogger } = require('./middlewares/logger.middleware');

const app = express();

// Middlewares de segurança e parsing
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rotas da API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));
app.use('/api/produtos', require('./routes/produtos.routes'));
app.use('/api/categorias', require('./routes/categorias.routes'));
app.use('/api/tamanhos', require('./routes/tamanhos.routes'));
app.use('/api/bordas', require('./routes/bordas.routes'));
app.use('/api/pedidos', require('./routes/pedidos.routes'));
app.use('/api/motoboys', require('./routes/motoboys.routes'));
app.use('/api/taxas', require('./routes/taxas.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/logs', require('./routes/logs.routes'));

// Rotas do ChatBot (sem autenticação)
app.use('/api/chatbot', require('./routes/chatbot.routes'));

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'LaSenhorita Pizzaria API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      clientes: '/api/clientes',
      produtos: '/api/produtos',
      categorias: '/api/categorias',
      tamanhos: '/api/tamanhos',
      bordas: '/api/bordas',
      pedidos: '/api/pedidos',
      motoboys: '/api/motoboys',
      taxas: '/api/taxas',
      dashboard: '/api/dashboard',
      logs: '/api/logs'
    }
  });
});

// Handler de erro 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Handler de erros globais
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Inicialização
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Testar conexão com banco
    await testConnection();

    // Sincronizar models (criar tabelas se não existirem)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Models sincronizados com o banco de dados');

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
🍕 ═══════════════════════════════════════════════════════
   LaSenhorita Pizzaria API
   Servidor rodando na porta ${PORT}
   Ambiente: ${process.env.NODE_ENV || 'development'}

   Endpoints:
   - Health: http://localhost:${PORT}/health
   - API: http://localhost:${PORT}/api
═══════════════════════════════════════════════════════ 🍕
      `);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido. Encerrando...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recebido. Encerrando...');
  await sequelize.close();
  process.exit(0);
});
