const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const { generateToken } = require('../middlewares/auth.middleware');
const { logAction } = require('../middlewares/logger.middleware');

const authController = {
  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const usuario = await Usuario.findOne({ where: { email } });

      if (!usuario) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      if (!usuario.ativo) {
        return res.status(401).json({ error: 'Usuário inativo' });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha);

      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = generateToken(usuario.id);

      // Log de login
      await logAction(req, 'LOGIN', 'usuarios', usuario.id, null, { email });

      return res.json({
        token,
        user: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role
        }
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },

  // POST /api/auth/logout
  async logout(req, res) {
    try {
      await logAction(req, 'LOGOUT', 'usuarios', req.userId);
      return res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro no logout:', error);
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
  },

  // GET /api/auth/me
  async me(req, res) {
    try {
      const usuario = await Usuario.findByPk(req.userId, {
        attributes: ['id', 'nome', 'email', 'role', 'ativo', 'created_at']
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json(usuario);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
  },

  // POST /api/auth/change-password
  async changePassword(req, res) {
    try {
      const { senhaAtual, novaSenha } = req.body;

      if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      }

      if (novaSenha.length < 6) {
        return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
      }

      const usuario = await Usuario.findByPk(req.userId);

      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }

      const senhaCriptografada = await bcrypt.hash(novaSenha, 10);
      await usuario.update({ senha: senhaCriptografada });

      await logAction(req, 'ALTERAR_SENHA', 'usuarios', req.userId);

      return res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return res.status(500).json({ error: 'Erro ao alterar senha' });
    }
  }
};

module.exports = authController;
