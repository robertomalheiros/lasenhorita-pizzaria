const { Router } = require('express');
const pedidosController = require('../controllers/pedidos.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

// Rota pública para consulta de pedido (chatbot)
router.get('/publico/numero/:numero', pedidosController.buscarPorNumero);

// Rotas autenticadas
router.use(authMiddleware);

router.get('/', pedidosController.listar);
router.get('/fila', pedidosController.listarFila);
router.get('/numero/:numero', pedidosController.buscarPorNumero);
router.get('/:id', pedidosController.buscarPorId);
router.post('/', pedidosController.criar);
router.put('/:id', pedidosController.atualizar);
router.patch('/:id/status', pedidosController.atualizarStatus);
router.patch('/:id/motoboy', pedidosController.atribuirMotoboy);
router.delete('/:id', pedidosController.cancelar);

module.exports = router;
