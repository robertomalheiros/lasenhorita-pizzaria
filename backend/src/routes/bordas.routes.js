const { Router } = require('express');
const bordasController = require('../controllers/bordas.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

// Rota pública para o chatbot
router.get('/publico', bordasController.listar);

// Rotas autenticadas
router.use(authMiddleware);

router.get('/', bordasController.listar);
router.get('/:id', bordasController.buscarPorId);
router.post('/', bordasController.criar);
router.put('/:id', bordasController.atualizar);
router.delete('/:id', bordasController.deletar);

module.exports = router;
