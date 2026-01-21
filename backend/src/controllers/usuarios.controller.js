const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const { logAction } = require('../middlewares/logger.middleware');

const usuariosController = {
  // GET /api/usuarios
  async listar(req, res) {
    try {
      const usuarios = await Usuario.findAll({
        attributes: ['id', 'nome', 'email', 'role', 'ativo', 'created_at', 'updated_at'],
        order: [['nome', 'ASC']]
      });
      return res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  },

  // GET /api/usuarios/:id
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findByPk(id, {
        attributes: ['id', 'nome', 'email', 'role', 'ativo', 'created_at', 'updated_at']
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json(usuario);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  },

  // POST /api/usuarios
  async criar(req, res) {
    try {
      const { nome, email, senha, role } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      const emailExiste = await Usuario.findOne({ where: { email } });
      if (emailExiste) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const senhaCriptografada = await bcrypt.hash(senha, 10);

      const usuario = await Usuario.create({
        nome,
        email,
        senha: senhaCriptografada,
        role: role || 'operador'
      });

      await logAction(req, 'CRIAR', 'usuarios', usuario.id, null, { nome, email, role });

      return res.status(201).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  },

  // PUT /api/usuarios/:id
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, role, ativo } = req.body;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const dadosAnteriores = { nome: usuario.nome, email: usuario.email, role: usuario.role, ativo: usuario.ativo };

      if (email && email !== usuario.email) {
        const emailExiste = await Usuario.findOne({ where: { email } });
        if (emailExiste) {
          return res.status(400).json({ error: 'Email já cadastrado' });
        }
      }

      await usuario.update({
        nome: nome || usuario.nome,
        email: email || usuario.email,
        role: role || usuario.role,
        ativo: ativo !== undefined ? ativo : usuario.ativo
      });

      await logAction(req, 'ATUALIZAR', 'usuarios', id, dadosAnteriores, { nome, email, role, ativo });

      return res.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  },

  // DELETE /api/usuarios/:id (soft delete)
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Não permitir deletar o próprio usuário
      if (parseInt(id) === req.userId) {
        return res.status(400).json({ error: 'Não é possível desativar o próprio usuário' });
      }

      await usuario.update({ ativo: false });

      await logAction(req, 'DELETAR', 'usuarios', id, { ativo: true }, { ativo: false });

      return res.json({ message: 'Usuário desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      return res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
  }
};

module.exports = usuariosController;
