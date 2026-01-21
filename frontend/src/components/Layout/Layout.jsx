import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  HiHome,
  HiClipboardList,
  HiUserGroup,
  HiCube,
  HiTruck,
  HiUsers,
  HiCog,
  HiLogout,
  HiMenu,
  HiX,
  HiShoppingCart,
  HiPlus
} from 'react-icons/hi';

const menuItems = [
  { path: '/', icon: HiHome, label: 'Dashboard' },
  { path: '/pedidos', icon: HiClipboardList, label: 'Pedidos' },
  { path: '/clientes', icon: HiUserGroup, label: 'Clientes' },
  { path: '/produtos', icon: HiCube, label: 'Produtos' },
  { path: '/motoboys', icon: HiTruck, label: 'Motoboys' },
  { path: '/configuracoes', icon: HiCog, label: 'Configurações' },
];

const adminMenuItems = [
  { path: '/usuarios', icon: HiUsers, label: 'Usuários' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar Mobile */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-red-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 bg-red-800">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🍕</span>
            <span className="text-xl font-bold text-white">LaSenhorita</span>
          </Link>
          <button
            className="lg:hidden text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Menu */}
        <nav className="mt-4 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-red-800 text-white'
                    : 'text-red-100 hover:bg-red-600'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}

          {/* Menu Admin */}
          {isAdmin() && (
            <>
              <div className="border-t border-red-600 my-4"></div>
              <p className="px-4 text-xs font-semibold text-red-300 uppercase tracking-wider mb-2">
                Administração
              </p>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-red-800 text-white'
                        : 'text-red-100 hover:bg-red-600'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-red-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.nome?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.nome}</p>
              <p className="text-xs text-red-200">{user?.role === 'admin' ? 'Administrador' : 'Operador'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-red-200 hover:text-white"
              title="Sair"
            >
              <HiLogout className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              <HiMenu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:ml-0 ml-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Botão novo pedido */}
              <Link
                to="/pedidos/novo"
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <HiPlus className="w-5 h-5 mr-2" />
                Novo Pedido
              </Link>

              {/* Carrinho */}
              {itemCount > 0 && (
                <Link
                  to="/pedidos/novo"
                  className="relative p-2 text-gray-600 hover:text-gray-900"
                >
                  <HiShoppingCart className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
