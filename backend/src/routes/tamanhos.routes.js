const { Router } = require('express');
const tamanhosController = require('../controllers/tamanhos.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

// Rota pública para o chatbot
router.get('/publico', tamanhosController.listar);

// Rotas autenticadas
router.use(authMiddleware);

router.get('/', tamanhosController.listar);
router.get('/:id', tamanhosController.buscarPorId);
router.post('/', tamanhosController.criar);
router.put('/:id', tamanhosController.atualizar);
router.delete('/:id', tamanhosController.deletar);

module.exports = router;
