const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);

router.get('/stats', dashboardController.stats);
router.get('/pedidos-hoje', dashboardController.pedidosHoje);
router.get('/faturamento', dashboardController.faturamento);
router.get('/produtos-mais-vendidos', dashboardController.produtosMaisVendidos);

module.exports = router;
