import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, pedidosService } from '../services/api';
import toast from 'react-hot-toast';
import {
  HiCurrencyDollar,
  HiClipboardList,
  HiUsers,
  HiClock,
  HiRefresh,
  HiEye,
  HiCheck,
  HiArrowRight
} from 'react-icons/hi';

// Componente de Temporizador
function Temporizador({ dataInicio }) {
  const [tempo, setTempo] = useState('');
  const [minutos, setMinutos] = useState(0);

  useEffect(() => {
    const calcularTempo = () => {
      const diff = Date.now() - new Date(dataInicio).getTime();
      const mins = Math.floor(diff / 60000);
      const segs = Math.floor((diff % 60000) / 1000);
      setMinutos(mins);
      setTempo(`${mins}:${segs.toString().padStart(2, '0')}`);
    };

    calcularTempo();
    const interval = setInterval(calcularTempo, 1000);
    return () => clearInterval(interval);
  }, [dataInicio]);

  const corClasse = minutos > 30 ? 'text-red-600' : minutos > 15 ? 'text-yellow-600' : 'text-green-600';

  return (
    <span className={`font-mono font-bold ${corClasse}`}>
      {tempo}
    </span>
  );
}

// Componente Card de Pedido
function CardPedido({ pedido, onAtualizarStatus }) {
  const [loading, setLoading] = useState(false);

  // Mapeamento completo de classes para evitar purge do Tailwind
  const statusConfig = {
    pendente: {
      label: 'Pendente',
      proximo: 'confirmado',
      labelProximo: 'Confirmar',
      borderClass: 'border-yellow-300',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-800',
      btnBg: 'bg-yellow-500 hover:bg-yellow-600'
    },
    confirmado: {
      label: 'Confirmado',
      proximo: 'preparando',
      labelProximo: 'Preparar',
      borderClass: 'border-blue-300',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800',
      btnBg: 'bg-blue-500 hover:bg-blue-600'
    },
    preparando: {
      label: 'Preparando',
      proximo: 'pronto',
      labelProximo: 'Pronto!',
      borderClass: 'border-orange-300',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-800',
      btnBg: 'bg-orange-500 hover:bg-orange-600'
    },
    pronto: {
      label: 'Pronto',
      proximo: 'saiu_entrega',
      labelProximo: 'Saiu Entrega',
      borderClass: 'border-green-300',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-800',
      btnBg: 'bg-green-500 hover:bg-green-600'
    },
    saiu_entrega: {
      label: 'Saiu Entrega',
      proximo: 'em_transito',
      labelProximo: 'Em Trânsito',
      borderClass: 'border-indigo-300',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-800',
      btnBg: 'bg-indigo-500 hover:bg-indigo-600'
    },
    em_transito: {
      label: 'Em Trânsito',
      proximo: 'entregue',
      labelProximo: 'Entregue',
      borderClass: 'border-purple-300',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-800',
      btnBg: 'bg-purple-500 hover:bg-purple-600'
    },
    entregue: {
      label: 'Entregue',
      proximo: null,
      labelProximo: null,
      borderClass: 'border-emerald-300',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      btnBg: 'bg-emerald-500 hover:bg-emerald-600'
    }
  };

  const config = statusConfig[pedido.status] || statusConfig.pendente;

  const handleAvancarStatus = async () => {
    if (!config.proximo) return;

    setLoading(true);
    try {
      await pedidosService.atualizarStatus(pedido.id, config.proximo);
      onAtualizarStatus();
      toast.success(`Pedido #${pedido.numero_pedido} atualizado!`);
    } catch (error) {
      toast.error('Erro ao atualizar pedido');
    } finally {
      setLoading(false);
    }
  };

  const minutos = Math.floor((Date.now() - new Date(pedido.hora_pedido).getTime()) / 60000);
  const isUrgente = minutos > 30;

  return (
    <div className={`pedido-card ${isUrgente ? 'urgente' : ''} ${config.borderClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold text-gray-900">#{pedido.numero_pedido}</span>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.badgeBg} ${config.badgeText}`}>
          {pedido.tipo_pedido.toUpperCase()}
        </span>
      </div>

      {/* Cliente */}
      <div className="mb-3">
        <p className="font-medium text-gray-900">{pedido.cliente?.nome || 'Cliente Balcão'}</p>
        {pedido.cliente?.telefone && (
          <p className="text-sm text-gray-500">{pedido.cliente.telefone}</p>
        )}
      </div>

      {/* Itens resumo */}
      <div className="mb-3 text-sm text-gray-600">
        {pedido.itens?.slice(0, 2).map((item, idx) => (
          <p key={idx} className="truncate">
            {item.quantidade}x {item.produto?.nome}
            {item.tamanho && ` (${item.tamanho.nome})`}
          </p>
        ))}
        {pedido.itens?.length > 2 && (
          <p className="text-gray-400">+{pedido.itens.length - 2} itens</p>
        )}
      </div>

      {/* Total e Tempo */}
      <div className="flex items-center justify-between mb-3 pt-3 border-t">
        <div>
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-900">
            R$ {parseFloat(pedido.total).toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Tempo</p>
          <Temporizador dataInicio={pedido.hora_pedido} />
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <Link
          to={`/pedidos?id=${pedido.id}`}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <HiEye className="w-4 h-4 mr-1" />
          Ver
        </Link>
        {config.proximo && (
          <button
            onClick={handleAvancarStatus}
            disabled={loading}
            className={`flex-1 flex items-center justify-center px-3 py-2 ${config.btnBg} text-white rounded-lg transition-colors disabled:opacity-50`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <HiArrowRight className="w-4 h-4 mr-1" />
                {config.labelProximo}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Componente Coluna de Fila
function ColunaFila({ titulo, pedidos, borderClass, textClass, badgeClass, onAtualizarStatus }) {
  return (
    <div className="flex-1 min-w-[280px]">
      <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${borderClass}`}>
        <h3 className={`font-semibold ${textClass}`}>{titulo}</h3>
        <span className={`px-2 py-1 text-sm font-bold rounded-full ${badgeClass}`}>
          {pedidos.length}
        </span>
      </div>
      <div className="space-y-3">
        {pedidos.map(pedido => (
          <CardPedido
            key={pedido.id}
            pedido={pedido}
            onAtualizarStatus={onAtualizarStatus}
          />
        ))}
        {pedidos.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <HiClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum pedido</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Página Dashboard
export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [fila, setFila] = useState({ pendente: [], confirmado: [], preparando: [], pronto: [], saiu_entrega: [], em_transito: [], entregue: [] });
  const [loading, setLoading] = useState(true);

  const carregarDados = useCallback(async () => {
    try {
      const [statsRes, filaRes] = await Promise.all([
        dashboardService.stats(),
        pedidosService.listarFila()
      ]);
      setStats(statsRes.data);
      setFila(filaRes.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarDados, 30000);
    return () => clearInterval(interval);
  }, [carregarDados]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <HiCurrencyDollar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Faturamento Hoje</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {stats?.faturamentoHoje || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <HiClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pedidos Hoje</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.pedidosHoje || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <HiUsers className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {stats?.ticketMedio || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <HiClock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Em Andamento</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.pedidosEmAndamento || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fila de Pedidos */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Fila de Pedidos</h2>
          <button
            onClick={carregarDados}
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiRefresh className="w-4 h-4 mr-2" />
            Atualizar
          </button>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4">
          <ColunaFila
            titulo="🟡 Pendentes"
            pedidos={fila.pendente}
            borderClass="border-yellow-500"
            textClass="text-yellow-700"
            badgeClass="bg-yellow-100 text-yellow-700"
            onAtualizarStatus={carregarDados}
          />
          <ColunaFila
            titulo="🔵 Confirmados"
            pedidos={fila.confirmado}
            borderClass="border-blue-500"
            textClass="text-blue-700"
            badgeClass="bg-blue-100 text-blue-700"
            onAtualizarStatus={carregarDados}
          />
          <ColunaFila
            titulo="🟠 Preparando"
            pedidos={fila.preparando}
            borderClass="border-orange-500"
            textClass="text-orange-700"
            badgeClass="bg-orange-100 text-orange-700"
            onAtualizarStatus={carregarDados}
          />
          <ColunaFila
            titulo="🟢 Prontos"
            pedidos={fila.pronto}
            borderClass="border-green-500"
            textClass="text-green-700"
            badgeClass="bg-green-100 text-green-700"
            onAtualizarStatus={carregarDados}
          />
          <ColunaFila
            titulo="🚴 Saiu Entrega"
            pedidos={fila.saiu_entrega}
            borderClass="border-indigo-500"
            textClass="text-indigo-700"
            badgeClass="bg-indigo-100 text-indigo-700"
            onAtualizarStatus={carregarDados}
          />
          <ColunaFila
            titulo="🛵 Em Trânsito"
            pedidos={fila.em_transito}
            borderClass="border-purple-500"
            textClass="text-purple-700"
            badgeClass="bg-purple-100 text-purple-700"
            onAtualizarStatus={carregarDados}
          />
          <ColunaFila
            titulo="✅ Entregues"
            pedidos={fila.entregue}
            borderClass="border-emerald-500"
            textClass="text-emerald-700"
            badgeClass="bg-emerald-100 text-emerald-700"
            onAtualizarStatus={carregarDados}
          />
        </div>
      </div>
    </div>
  );
}
