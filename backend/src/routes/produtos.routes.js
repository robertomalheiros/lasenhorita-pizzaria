const { Router } = require('express');
const produtosController = require('../controllers/produtos.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

// Rotas públicas para o chatbot
router.get('/publico', produtosController.listar);
router.get('/publico/pizzas', produtosController.listarPizzas);
router.get('/publico/categoria/:categoriaId', produtosController.listarPorCategoria);

// Rotas autenticadas
router.use(authMiddleware);

router.get('/', produtosController.listar);
router.get('/pizzas', produtosController.listarPizzas);
router.get('/categoria/:categoriaId', produtosController.listarPorCategoria);
router.get('/:id', produtosController.buscarPorId);
router.post('/', produtosController.criar);
router.put('/:id', produtosController.atualizar);
router.delete('/:id', produtosController.deletar);

module.exports = router;
