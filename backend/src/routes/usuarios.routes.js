const { Router } = require('express');
const usuariosController = require('../controllers/usuarios.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');

const router = Router();

// Todas as rotas requerem autenticação e permissão de admin
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', usuariosController.listar);
router.get('/:id', usuariosController.buscarPorId);
router.post('/', usuariosController.criar);
router.put('/:id', usuariosController.atualizar);
router.delete('/:id', usuariosController.deletar);

module.exports = router;
