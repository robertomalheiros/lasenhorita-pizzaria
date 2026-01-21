const { Router } = require('express');
const motoboysController = require('../controllers/motoboys.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);

router.get('/', motoboysController.listar);
router.get('/disponiveis', motoboysController.listarDisponiveis);
router.get('/:id', motoboysController.buscarPorId);
router.post('/', motoboysController.criar);
router.put('/:id', motoboysController.atualizar);
router.patch('/:id/disponibilidade', motoboysController.toggleDisponibilidade);
router.delete('/:id', motoboysController.deletar);

module.exports = router;
