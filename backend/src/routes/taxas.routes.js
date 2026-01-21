const { Router } = require('express');
const taxasController = require('../controllers/taxas.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

// Rota pública para o chatbot
router.get('/publico', taxasController.listar);
router.get('/publico/bairro/:bairro', taxasController.buscarPorBairro);

// Rotas autenticadas
router.use(authMiddleware);

router.get('/', taxasController.listar);
router.get('/bairro/:bairro', taxasController.buscarPorBairro);
router.post('/', taxasController.criar);
router.put('/:id', taxasController.atualizar);
router.delete('/:id', taxasController.deletar);

module.exports = router;
