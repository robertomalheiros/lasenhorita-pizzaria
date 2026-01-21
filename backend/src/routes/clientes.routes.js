const { Router } = require('express');
const clientesController = require('../controllers/clientes.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);

router.get('/', clientesController.listar);
router.get('/telefone/:telefone', clientesController.buscarPorTelefone);
router.get('/:id', clientesController.buscarPorId);
router.post('/', clientesController.criar);
router.put('/:id', clientesController.atualizar);
router.delete('/:id', clientesController.deletar);

module.exports = router;
