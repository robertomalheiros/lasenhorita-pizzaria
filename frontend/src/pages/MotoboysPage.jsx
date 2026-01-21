import React, { useState, useEffect } from 'react';
import { motoboysService } from '../services/api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';

export default function MotoboysPage() {
  const [motoboys, setMotoboys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({ nome: '', telefone: '', placa_moto: '' });
  const [salvando, setSalvando] = useState(false);

  const carregarMotoboys = async () => {
    setLoading(true);
    try {
      const response = await motoboysService.listar();
      setMotoboys(response.data);
    } catch (error) {
      toast.error('Erro ao carregar motoboys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarMotoboys(); }, []);

  const abrirModal = (motoboy = null) => {
    if (motoboy) {
      setEditando(motoboy);
      setFormData({ nome: motoboy.nome, telefone: motoboy.telefone || '', placa_moto: motoboy.placa_moto || '' });
    } else {
      setEditando(null);
      setFormData({ nome: '', telefone: '', placa_moto: '' });
    }
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!formData.nome) {
      toast.error('Nome é obrigatório');
      return;
    }
    setSalvando(true);
    try {
      if (editando) {
        await motoboysService.atualizar(editando.id, formData);
        toast.success('Motoboy atualizado!');
      } else {
        await motoboysService.criar(formData);
        toast.success('Motoboy criado!');
      }
      setModalAberto(false);
      carregarMotoboys();
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const toggleDisponibilidade = async (id) => {
    try {
      await motoboysService.toggleDisponibilidade(id);
      carregarMotoboys();
    } catch (error) {
      toast.error('Erro ao alterar disponibilidade');
    }
  };

  const deletar = async (id) => {
    if (!window.confirm('Desativar este motoboy?')) return;
    try {
      await motoboysService.deletar(id);
      toast.success('Motoboy desativado!');
      carregarMotoboys();
    } catch (error) {
      toast.error('Erro ao desativar');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Motoboys</h1>
        <button onClick={() => abrirModal()} className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          <HiPlus className="w-5 h-5 mr-2" />Novo Motoboy
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {motoboys.map(motoboy => (
          <div key={motoboy.id} className={`bg-white rounded-xl shadow-sm p-6 ${!motoboy.ativo && 'opacity-50'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-xl">🏍️</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">{motoboy.nome}</h3>
                  {motoboy.placa_moto && <p className="text-sm text-gray-500">{motoboy.placa_moto}</p>}
                </div>
              </div>
              <button
                onClick={() => toggleDisponibilidade(motoboy.id)}
                className={`px-3 py-1 text-sm rounded-full ${
                  motoboy.disponivel
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {motoboy.disponivel ? 'Disponível' : 'Ocupado'}
              </button>
            </div>

            {motoboy.telefone && <p className="text-sm text-gray-600 mb-4">📱 {motoboy.telefone}</p>}

            <div className="flex gap-2 pt-4 border-t">
              <button onClick={() => abrirModal(motoboy)} className="flex-1 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                <HiPencil className="w-4 h-4 mx-auto" />
              </button>
              <button onClick={() => deletar(motoboy.id)} className="flex-1 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                <HiTrash className="w-4 h-4 mx-auto" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{editando ? 'Editar Motoboy' : 'Novo Motoboy'}</h3>
              <button onClick={() => setModalAberto(false)}><HiX className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Nome *" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="text" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} placeholder="Telefone" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="text" value={formData.placa_moto} onChange={(e) => setFormData({...formData, placa_moto: e.target.value})} placeholder="Placa da moto" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
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
