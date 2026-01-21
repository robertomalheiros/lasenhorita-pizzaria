import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error('Sessão expirada. Faça login novamente.');
      } else if (status === 403) {
        toast.error('Acesso negado.');
      } else if (status === 404) {
        toast.error(data.error || 'Recurso não encontrado.');
      } else if (status >= 500) {
        toast.error('Erro no servidor. Tente novamente.');
      } else {
        toast.error(data.error || 'Erro ao processar requisição.');
      }
    } else if (error.request) {
      toast.error('Erro de conexão. Verifique sua internet.');
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authService = {
  login: (email, senha) => api.post('/auth/login', { email, senha }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (senhaAtual, novaSenha) =>
    api.post('/auth/change-password', { senhaAtual, novaSenha })
};

// ==================== USUARIOS ====================
export const usuariosService = {
  listar: () => api.get('/usuarios'),
  buscarPorId: (id) => api.get(`/usuarios/${id}`),
  criar: (data) => api.post('/usuarios', data),
  atualizar: (id, data) => api.put(`/usuarios/${id}`, data),
  deletar: (id) => api.delete(`/usuarios/${id}`)
};

// ==================== CLIENTES ====================
export const clientesService = {
  listar: (params) => api.get('/clientes', { params }),
  buscarPorId: (id) => api.get(`/clientes/${id}`),
  buscarPorTelefone: (telefone) => api.get(`/clientes/telefone/${telefone}`),
  criar: (data) => api.post('/clientes', data),
  atualizar: (id, data) => api.put(`/clientes/${id}`, data),
  deletar: (id) => api.delete(`/clientes/${id}`)
};

// ==================== PRODUTOS ====================
export const produtosService = {
  listar: (params) => api.get('/produtos', { params }),
  listarPizzas: () => api.get('/produtos/pizzas'),
  listarPorCategoria: (categoriaId) => api.get(`/produtos/categoria/${categoriaId}`),
  buscarPorId: (id) => api.get(`/produtos/${id}`),
  criar: (data) => api.post('/produtos', data),
  atualizar: (id, data) => api.put(`/produtos/${id}`, data),
  deletar: (id) => api.delete(`/produtos/${id}`)
};

// ==================== CATEGORIAS ====================
export const categoriasService = {
  listar: () => api.get('/categorias'),
  buscarPorId: (id) => api.get(`/categorias/${id}`),
  criar: (data) => api.post('/categorias', data),
  atualizar: (id, data) => api.put(`/categorias/${id}`, data),
  deletar: (id) => api.delete(`/categorias/${id}`)
};

// ==================== TAMANHOS ====================
export const tamanhosService = {
  listar: () => api.get('/tamanhos'),
  buscarPorId: (id) => api.get(`/tamanhos/${id}`),
  criar: (data) => api.post('/tamanhos', data),
  atualizar: (id, data) => api.put(`/tamanhos/${id}`, data),
  deletar: (id) => api.delete(`/tamanhos/${id}`)
};

// ==================== BORDAS ====================
export const bordasService = {
  listar: () => api.get('/bordas'),
  buscarPorId: (id) => api.get(`/bordas/${id}`),
  criar: (data) => api.post('/bordas', data),
  atualizar: (id, data) => api.put(`/bordas/${id}`, data),
  deletar: (id) => api.delete(`/bordas/${id}`)
};

// ==================== PEDIDOS ====================
export const pedidosService = {
  listar: (params) => api.get('/pedidos', { params }),
  listarFila: () => api.get('/pedidos/fila'),
  buscarPorId: (id) => api.get(`/pedidos/${id}`),
  buscarPorNumero: (numero) => api.get(`/pedidos/numero/${numero}`),
  criar: (data) => api.post('/pedidos', data),
  atualizar: (id, data) => api.put(`/pedidos/${id}`, data),
  atualizarStatus: (id, status) => api.patch(`/pedidos/${id}/status`, { status }),
  atribuirMotoboy: (id, motoboyId) => api.patch(`/pedidos/${id}/motoboy`, { motoboy_id: motoboyId }),
  cancelar: (id, motivo) => api.delete(`/pedidos/${id}`, { data: { motivo } })
};

// ==================== MOTOBOYS ====================
export const motoboysService = {
  listar: (params) => api.get('/motoboys', { params }),
  listarDisponiveis: () => api.get('/motoboys/disponiveis'),
  buscarPorId: (id) => api.get(`/motoboys/${id}`),
  criar: (data) => api.post('/motoboys', data),
  atualizar: (id, data) => api.put(`/motoboys/${id}`, data),
  toggleDisponibilidade: (id) => api.patch(`/motoboys/${id}/disponibilidade`),
  deletar: (id) => api.delete(`/motoboys/${id}`)
};

// ==================== TAXAS ====================
export const taxasService = {
  listar: () => api.get('/taxas'),
  buscarPorBairro: (bairro) => api.get(`/taxas/bairro/${encodeURIComponent(bairro)}`),
  criar: (data) => api.post('/taxas', data),
  atualizar: (id, data) => api.put(`/taxas/${id}`, data),
  deletar: (id) => api.delete(`/taxas/${id}`)
};

// ==================== DASHBOARD ====================
export const dashboardService = {
  stats: () => api.get('/dashboard/stats'),
  pedidosHoje: () => api.get('/dashboard/pedidos-hoje'),
  faturamento: (periodo) => api.get('/dashboard/faturamento', { params: { periodo } }),
  produtosMaisVendidos: (limite) => api.get('/dashboard/produtos-mais-vendidos', { params: { limite } })
};

// ==================== LOGS ====================
export const logsService = {
  listar: (params) => api.get('/logs', { params }),
  listarAcoes: () => api.get('/logs/acoes'),
  listarEntidades: () => api.get('/logs/entidades')
};

export default api;
