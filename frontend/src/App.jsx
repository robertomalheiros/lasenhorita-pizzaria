import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Layout from './components/Layout/Layout';

// Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PedidosPage from './pages/PedidosPage';
import NovoPedidoPage from './pages/NovoPedidoPage';
import ClientesPage from './pages/ClientesPage';
import ProdutosPage from './pages/ProdutosPage';
import MotoboysPage from './pages/MotoboysPage';
import UsuariosPage from './pages/UsuariosPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';

// Componente de rota protegida
function PrivateRoute({ children, adminOnly = false }) {
  const { signed, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!signed) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Rota pública - Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas protegidas */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<DashboardPage />} />

        {/* Pedidos */}
        <Route path="pedidos" element={<PedidosPage />} />
        <Route path="pedidos/novo" element={<NovoPedidoPage />} />

        {/* Clientes */}
        <Route path="clientes" element={<ClientesPage />} />

        {/* Produtos */}
        <Route path="produtos" element={<ProdutosPage />} />

        {/* Motoboys */}
        <Route path="motoboys" element={<MotoboysPage />} />

        {/* Configurações (Tamanhos, Bordas, Taxas) */}
        <Route path="configuracoes" element={<ConfiguracoesPage />} />

        {/* Usuários (Admin only) */}
        <Route
          path="usuarios"
          element={
            <PrivateRoute adminOnly>
              <UsuariosPage />
            </PrivateRoute>
          }
        />
      </Route>

      {/* Rota 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
