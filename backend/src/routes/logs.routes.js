const { Router } = require('express');
const logsController = require('../controllers/logs.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

// Logs requerem autenticação de admin
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', logsController.listar);
router.get('/acoes', logsController.listarAcoes);
router.get('/entidades', logsController.listarEntidades);

module.exports = router;
