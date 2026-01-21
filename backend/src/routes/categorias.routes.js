const { Router } = require('express');
const categoriasController = require('../controllers/categorias.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

// Rota pública para o chatbot
router.get('/publico', categoriasController.listar);

// Rotas autenticadas
router.use(authMiddleware);

router.get('/', categoriasController.listar);
router.get('/:id', categoriasController.buscarPorId);
router.post('/', categoriasController.criar);
router.put('/:id', categoriasController.atualizar);
router.delete('/:id', categoriasController.deletar);

module.exports = router;
