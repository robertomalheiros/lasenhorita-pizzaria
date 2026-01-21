import React, { useState, useEffect } from 'react';
import { clientesService } from '../services/api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiX } from 'react-icons/hi';

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [formData, setFormData] = useState({ nome: '', telefone: '', endereco: '', bairro: '', referencia: '' });
  const [salvando, setSalvando] = useState(false);

  const carregarClientes = async () => {
    setLoading(true);
    try {
      const response = await clientesService.listar({ busca });
      setClientes(response.data.data);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarClientes(); }, []);

  const abrirModal = (cliente = null) => {
    if (cliente) {
      setClienteEditando(cliente);
      setFormData({ nome: cliente.nome, telefone: cliente.telefone, endereco: cliente.endereco || '', bairro: cliente.bairro || '', referencia: cliente.referencia || '' });
    } else {
      setClienteEditando(null);
      setFormData({ nome: '', telefone: '', endereco: '', bairro: '', referencia: '' });
    }
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!formData.nome || !formData.telefone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }
    setSalvando(true);
    try {
      if (clienteEditando) {
        await clientesService.atualizar(clienteEditando.id, formData);
        toast.success('Cliente atualizado!');
      } else {
        await clientesService.criar(formData);
        toast.success('Cliente criado!');
      }
      setModalAberto(false);
      carregarClientes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const deletar = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      await clientesService.deletar(id);
      toast.success('Cliente excluído!');
      carregarClientes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button onClick={() => abrirModal()} className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          <HiPlus className="w-5 h-5 mr-2" />Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-4">
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
          <button onClick={carregarClientes} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <HiSearch className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bairro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientes.map(cliente => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium">{cliente.nome}</td>
                  <td className="px-4 py-4">{cliente.telefone}</td>
                  <td className="px-4 py-4">{cliente.bairro || '-'}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => abrirModal(cliente)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><HiPencil className="w-5 h-5" /></button>
                      <button onClick={() => deletar(cliente.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><HiTrash className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button onClick={() => setModalAberto(false)}><HiX className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Nome *" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="text" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} placeholder="Telefone *" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="text" value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} placeholder="Endereço" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="text" value={formData.bairro} onChange={(e) => setFormData({...formData, bairro: e.target.value})} placeholder="Bairro" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="text" value={formData.referencia} onChange={(e) => setFormData({...formData, referencia: e.target.value})} placeholder="Referência" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
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
