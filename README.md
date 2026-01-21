# 🍕 LaSenhorita Pizzaria

Sistema completo de gestão de pedidos para pizzaria com:
- **Backend API** (Node.js + Express + PostgreSQL)
- **Frontend Web** (React + Tailwind CSS)
- **Chatbot WhatsApp** (WPPConnect)

## 📋 Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- Git

## 🚀 Início Rápido

### 1. Clone o repositório
```bash
git clone <url-do-repo>
cd lasenhorita-pizzaria
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Inicie os containers
```bash
docker-compose up -d
```

### 4. Acesse o sistema
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Banco de Dados**: localhost:5433

### Credenciais padrão
- **Email**: admin@lasenhorita.com
- **Senha**: Admin@123

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                          DOCKER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Frontend   │  │   Backend   │  │   Chatbot   │             │
│  │   React     │  │   Node.js   │  │  WPPConnect │             │
│  │   :3000     │  │   :3001     │  │             │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                   ┌──────┴──────┐                               │
│                   │ PostgreSQL  │                               │
│                   │    :5433    │                               │
│                   └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura do Projeto

```
lasenhorita-pizzaria/
├── docker-compose.yml
├── .env
├── README.md
│
├── backend/                 # API Node.js + Express
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── services/
│   │   └── utils/
│   └── seeds/
│
├── frontend/               # React + Tailwind
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── context/
│       └── hooks/
│
└── chatbot/               # WhatsApp Bot
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── handlers/
        ├── services/
        └── utils/
```

## 🔧 Desenvolvimento Local

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Chatbot
```bash
cd chatbot
npm install
npm run dev
```

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário

### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `GET /api/pedidos/fila` - Fila de pedidos
- `POST /api/pedidos` - Criar pedido
- `PATCH /api/pedidos/:id/status` - Atualizar status

### Produtos
- `GET /api/produtos` - Listar produtos
- `GET /api/produtos/pizzas` - Listar pizzas

### Clientes
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/telefone/:tel` - Buscar por telefone

## 🍕 Cardápio

### Tamanhos de Pizza
| Tamanho | Fatias | Sabores | Tradicional | Especial | Doce |
|---------|--------|---------|-------------|----------|------|
| Broto   | 4      | 1       | R$ 28,00    | R$ 35,00 | R$ 25,00 |
| Média   | 6      | 2       | R$ 42,00    | R$ 52,00 | R$ 38,00 |
| Grande  | 8      | 2       | R$ 52,00    | R$ 65,00 | R$ 48,00 |
| Família | 12     | 3       | R$ 68,00    | R$ 85,00 | R$ 62,00 |

### Bordas
- Sem Borda: Grátis
- Catupiry: +R$ 8,00
- Cheddar: +R$ 8,00
- Cream Cheese: +R$ 10,00
- Chocolate: +R$ 10,00

## 📱 Chatbot WhatsApp

O chatbot funciona com menus numéricos (sem IA):

1. Ver Cardápio
2. Fazer Pedido
3. Consultar Pedido
4. Falar com Atendente

## 🔐 Segurança

- JWT para autenticação
- Bcrypt para hash de senhas
- Helmet para headers HTTP
- Validação de inputs

## 📄 Licença

Projeto privado - LaSenhorita Pizzaria
