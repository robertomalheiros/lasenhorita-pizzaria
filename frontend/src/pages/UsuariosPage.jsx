import React, { useState, useEffect } from 'react';
import { usuariosService } from '../services/api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiX, HiShieldCheck, HiUser } from 'react-icons/hi';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '', role: 'operador' });
  const [salvando, setSalvando] = useState(false);

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await usuariosService.listar();
      setUsuarios(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarUsuarios(); }, []);

  const abrirModal = (usuario = null) => {
    if (usuario) {
      setEditando(usuario);
      setFormData({ nome: usuario.nome, email: usuario.email, senha: '', role: usuario.role });
    } else {
      setEditando(null);
      setFormData({ nome: '', email: '', senha: '', role: 'operador' });
    }
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!formData.nome || !formData.email || (!editando && !formData.senha)) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSalvando(true);
    try {
      const data = { ...formData };
      if (editando && !data.senha) delete data.senha;

      if (editando) {
        await usuariosService.atualizar(editando.id, data);
        toast.success('Usuário atualizado!');
      } else {
        await usuariosService.criar(data);
        toast.success('Usuário criado!');
      }
      setModalAberto(false);
      carregarUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const deletar = async (id) => {
    if (!window.confirm('Desativar este usuário?')) return;
    try {
      await usuariosService.deletar(id);
      toast.success('Usuário desativado!');
      carregarUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao desativar');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <button onClick={() => abrirModal()} className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          <HiPlus className="w-5 h-5 mr-2" />Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usuarios.map(usuario => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 font-medium">{usuario.nome}</td>
                <td className="px-4 py-4">{usuario.email}</td>
                <td className="px-4 py-4">
                  <span className={`flex items-center gap-1 ${usuario.role === 'admin' ? 'text-purple-600' : 'text-gray-600'}`}>
                    {usuario.role === 'admin' ? <HiShieldCheck className="w-4 h-4" /> : <HiUser className="w-4 h-4" />}
                    {usuario.role === 'admin' ? 'Administrador' : 'Operador'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${usuario.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => abrirModal(usuario)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><HiPencil className="w-5 h-5" /></button>
                    <button onClick={() => deletar(usuario.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><HiTrash className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{editando ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setModalAberto(false)}><HiX className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Nome *" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email *" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="password" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} placeholder={editando ? "Nova senha (deixe vazio para manter)" : "Senha *"} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setModalAberto(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
