import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pedidosService, motoboysService } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiSearch,
  HiFilter,
  HiEye,
  HiX,
  HiCheck,
  HiArrowRight,
  HiPhone,
  HiLocationMarker,
  HiCreditCard,
  HiTruck,
  HiXCircle
} from 'react-icons/hi';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'preparando', label: 'Preparando' },
  { value: 'pronto', label: 'Pronto' },
  { value: 'saiu_entrega', label: 'Saiu p/ Entrega' },
  { value: 'em_transito', label: 'Em Trânsito' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' }
];

const tipoOptions = [
  { value: '', label: 'Todos' },
  { value: 'balcao', label: 'Balcão' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'whatsapp', label: 'WhatsApp' }
];

const statusConfig = {
  pendente: {
    label: 'Pendente',
    proximo: 'confirmado',
    labelProximo: 'Confirmar',
    badgeClass: 'bg-yellow-100 text-yellow-800',
    btnClass: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  },
  confirmado: {
    label: 'Confirmado',
    proximo: 'preparando',
    labelProximo: 'Preparar',
    badgeClass: 'bg-blue-100 text-blue-800',
    btnClass: 'bg-blue-500 hover:bg-blue-600 text-white'
  },
  preparando: {
    label: 'Preparando',
    proximo: 'pronto',
    labelProximo: 'Pronto!',
    badgeClass: 'bg-orange-100 text-orange-800',
    btnClass: 'bg-orange-500 hover:bg-orange-600 text-white'
  },
  pronto: {
    label: 'Pronto',
    proximo: 'saiu_entrega',
    labelProximo: 'Saiu Entrega',
    badgeClass: 'bg-green-100 text-green-800',
    btnClass: 'bg-green-500 hover:bg-green-600 text-white'
  },
  saiu_entrega: {
    label: 'Saiu p/ Entrega',
    proximo: 'em_transito',
    labelProximo: 'Em Trânsito',
    badgeClass: 'bg-purple-100 text-purple-800',
    btnClass: 'bg-purple-500 hover:bg-purple-600 text-white'
  },
  em_transito: {
    label: 'Em Trânsito',
    proximo: 'entregue',
    labelProximo: 'Entregue',
    badgeClass: 'bg-indigo-100 text-indigo-800',
    btnClass: 'bg-indigo-500 hover:bg-indigo-600 text-white'
  },
  entregue: {
    label: 'Entregue',
    proximo: null,
    labelProximo: null,
    badgeClass: 'bg-gray-100 text-gray-800',
    btnClass: ''
  },
  cancelado: {
    label: 'Cancelado',
    proximo: null,
    labelProximo: null,
    badgeClass: 'bg-red-100 text-red-800',
    btnClass: ''
  }
};

// Modal de Detalhes do Pedido
function ModalDetalhesPedido({ pedido, onClose, onStatusAtualizado }) {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingMotoboy, setLoadingMotoboy] = useState(false);
  const [loadingCancelar, setLoadingCancelar] = useState(false);
  const [motoboys, setMotoboys] = useState([]);
  const [motoboyId, setMotoboyId] = useState(pedido.motoboy_id || '');
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [showCancelar, setShowCancelar] = useState(false);

  const config = statusConfig[pedido.status] || {};

  useEffect(() => {
    if (pedido.tipo_pedido === 'delivery') {
      carregarMotoboys();
    }
  }, [pedido.tipo_pedido]);

  const carregarMotoboys = async () => {
    try {
      const response = await motoboysService.listarDisponiveis();
      setMotoboys(response.data);
    } catch (error) {
      console.error('Erro ao carregar motoboys:', error);
    }
  };

  const handleAvancarStatus = async () => {
    if (!config.proximo) return;

    setLoadingStatus(true);
    try {
      await pedidosService.atualizarStatus(pedido.id, config.proximo);
      toast.success(`Pedido #${pedido.numero_pedido} atualizado para ${statusConfig[config.proximo].label}!`);
      onStatusAtualizado();
      onClose();
    } catch (error) {
      toast.error('Erro ao atualizar status do pedido');
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleAtribuirMotoboy = async () => {
    if (!motoboyId) {
      toast.error('Selecione um motoboy');
      return;
    }

    setLoadingMotoboy(true);
    try {
      await pedidosService.atribuirMotoboy(pedido.id, motoboyId);
      toast.success('Motoboy atribuído com sucesso!');
      onStatusAtualizado();
    } catch (error) {
      toast.error('Erro ao atribuir motoboy');
    } finally {
      setLoadingMotoboy(false);
    }
  };

  const handleCancelar = async () => {
    setLoadingCancelar(true);
    try {
      await pedidosService.cancelar(pedido.id, motivoCancelamento);
      toast.success('Pedido cancelado');
      onStatusAtualizado();
      onClose();
    } catch (error) {
      toast.error('Erro ao cancelar pedido');
    } finally {
      setLoadingCancelar(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pedido #{pedido.numero_pedido}</h2>
            <p className="text-sm text-gray-500">
              {format(new Date(pedido.hora_pedido), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Atual */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">Status</span>
              <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${config.badgeClass}`}>
                {config.label}
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500">Tipo</span>
              <p className="font-medium capitalize">{pedido.tipo_pedido}</p>
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Cliente</h3>
            <p className="font-medium">{pedido.cliente?.nome || 'Cliente Balcão'}</p>
            {pedido.cliente?.telefone && (
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <HiPhone className="w-4 h-4 mr-2" />
                {pedido.cliente.telefone}
              </p>
            )}
            {pedido.endereco_entrega && (
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <HiLocationMarker className="w-4 h-4 mr-2" />
                {pedido.endereco_entrega}
                {pedido.bairro_entrega && ` - ${pedido.bairro_entrega}`}
              </p>
            )}
          </div>

          {/* Itens do Pedido */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Itens</h3>
            <div className="space-y-2">
              {pedido.itens?.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b last:border-b-0">
                  <div>
                    <span className="font-medium">{item.quantidade}x </span>
                    <span>{item.produto?.nome || 'Produto'}</span>
                    {item.tamanho && (
                      <span className="text-gray-500"> ({item.tamanho.nome})</span>
                    )}
                    {item.borda && (
                      <span className="text-gray-500"> - Borda: {item.borda.nome}</span>
                    )}
                    {item.observacao && (
                      <p className="text-sm text-gray-500 italic">{item.observacao}</p>
                    )}
                  </div>
                  <span className="font-medium">
                    R$ {parseFloat(item.subtotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totais */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Subtotal</span>
              <span>R$ {parseFloat(pedido.subtotal).toFixed(2)}</span>
            </div>
            {pedido.taxa_entrega > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Taxa de entrega</span>
                <span>R$ {parseFloat(pedido.taxa_entrega).toFixed(2)}</span>
              </div>
            )}
            {pedido.desconto > 0 && (
              <div className="flex justify-between text-sm mb-1 text-green-600">
                <span>Desconto</span>
                <span>- R$ {parseFloat(pedido.desconto).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
              <span>Total</span>
              <span className="text-red-600">R$ {parseFloat(pedido.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Pagamento */}
          <div className="flex items-center text-sm">
            <HiCreditCard className="w-5 h-5 mr-2 text-gray-400" />
            <span className="text-gray-600">Pagamento: </span>
            <span className="font-medium ml-1 capitalize">{pedido.forma_pagamento}</span>
            {pedido.troco_para && pedido.forma_pagamento === 'dinheiro' && (
              <span className="text-gray-500 ml-2">(Troco para R$ {parseFloat(pedido.troco_para).toFixed(2)})</span>
            )}
          </div>

          {/* Motoboy (para delivery) */}
          {pedido.tipo_pedido === 'delivery' && pedido.status !== 'cancelado' && pedido.status !== 'entregue' && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <HiTruck className="w-5 h-5 mr-2" />
                Motoboy
              </h3>
              <div className="flex gap-2">
                <select
                  value={motoboyId}
                  onChange={(e) => setMotoboyId(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecione um motoboy</option>
                  {motoboys.map(m => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
                <button
                  onClick={handleAtribuirMotoboy}
                  disabled={loadingMotoboy || !motoboyId}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loadingMotoboy ? '...' : 'Atribuir'}
                </button>
              </div>
              {pedido.motoboy && (
                <p className="mt-2 text-sm text-purple-600">
                  Motoboy atual: <strong>{pedido.motoboy.nome}</strong>
                </p>
              )}
            </div>
          )}

          {/* Observações */}
          {pedido.observacoes && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-1">Observações</h3>
              <p className="text-sm text-gray-700">{pedido.observacoes}</p>
            </div>
          )}

          {/* Ações */}
          {pedido.status !== 'cancelado' && pedido.status !== 'entregue' && (
            <div className="space-y-3 pt-4 border-t">
              {/* Botão Avançar Status */}
              {config.proximo && (
                <button
                  onClick={handleAvancarStatus}
                  disabled={loadingStatus}
                  className={`w-full flex items-center justify-center px-4 py-3 ${config.btnClass} rounded-lg transition-colors disabled:opacity-50 text-lg font-semibold`}
                >
                  {loadingStatus ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <HiArrowRight className="w-5 h-5 mr-2" />
                      {config.labelProximo}
                    </>
                  )}
                </button>
              )}

              {/* Botão Cancelar */}
              {!showCancelar ? (
                <button
                  onClick={() => setShowCancelar(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <HiXCircle className="w-5 h-5 mr-2" />
                  Cancelar Pedido
                </button>
              ) : (
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 mb-2">Motivo do cancelamento (opcional):</p>
                  <textarea
                    value={motivoCancelamento}
                    onChange={(e) => setMotivoCancelamento(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg mb-2"
                    rows={2}
                    placeholder="Ex: Cliente desistiu"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancelar(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleCancelar}
                      disabled={loadingCancelar}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {loadingCancelar ? 'Cancelando...' : 'Confirmar Cancelamento'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    status: '',
    tipo_pedido: '',
    data_inicio: '',
    data_fim: ''
  });
  const [paginacao, setPaginacao] = useState({ page: 1, totalPages: 1, total: 0 });
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  const carregarPedidos = async (page = 1) => {
    setLoading(true);
    try {
      const params = { ...filtros, page, limit: 20 };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);

      const response = await pedidosService.listar(params);
      setPedidos(response.data.data);
      setPaginacao({
        page: response.data.page,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const aplicarFiltros = () => {
    carregarPedidos(1);
  };

  const limparFiltros = () => {
    setFiltros({ status: '', tipo_pedido: '', data_inicio: '', data_fim: '' });
    carregarPedidos(1);
  };

  const handleVerPedido = async (pedido) => {
    try {
      // Buscar pedido completo com detalhes
      const response = await pedidosService.buscarPorId(pedido.id);
      setPedidoSelecionado(response.data);
    } catch (error) {
      toast.error('Erro ao carregar detalhes do pedido');
    }
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || {};
    return config.badgeClass || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <Link
          to="/pedidos/novo"
          className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <HiPlus className="w-5 h-5 mr-2" />
          Novo Pedido
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <HiFilter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filtros.tipo_pedido}
            onChange={(e) => setFiltros({ ...filtros, tipo_pedido: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {tipoOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={filtros.data_inicio}
            onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Data início"
          />

          <input
            type="date"
            value={filtros.data_fim}
            onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Data fim"
          />

          <div className="flex gap-2">
            <button
              onClick={aplicarFiltros}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <HiSearch className="w-4 h-4 mr-2" />
              Buscar
            </button>
            <button
              onClick={limparFiltros}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pedidos.map(pedido => (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium text-gray-900">
                        #{pedido.numero_pedido}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-900">{pedido.cliente?.nome || 'Balcão'}</p>
                        {pedido.cliente?.telefone && (
                          <p className="text-sm text-gray-500">{pedido.cliente.telefone}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="capitalize">{pedido.tipo_pedido}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(pedido.status)}`}>
                          {statusConfig[pedido.status]?.label || pedido.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium">
                        R$ {parseFloat(pedido.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {format(new Date(pedido.hora_pedido), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleVerPedido(pedido)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Ver detalhes e ações"
                        >
                          <HiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Mostrando {pedidos.length} de {paginacao.total} pedidos
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => carregarPedidos(paginacao.page - 1)}
                  disabled={paginacao.page === 1}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1">
                  {paginacao.page} / {paginacao.totalPages}
                </span>
                <button
                  onClick={() => carregarPedidos(paginacao.page + 1)}
                  disabled={paginacao.page === paginacao.totalPages}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próximo
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Detalhes */}
      {pedidoSelecionado && (
        <ModalDetalhesPedido
          pedido={pedidoSelecionado}
          onClose={() => setPedidoSelecionado(null)}
          onStatusAtualizado={carregarPedidos}
        />
      )}
    </div>
  );
}
