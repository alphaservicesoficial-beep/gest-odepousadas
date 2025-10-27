# Arquitetura Inicial

## Visão Geral

Projeto estruturado em duas aplicações desacopladas:

- `frontend/`: SPA em React + TypeScript, roteamento com React Router e design com Tailwind.
- `backend/`: API REST em FastAPI, preparada para integração com Firebase Authentication e Firestore.

Comunicação prevista via HTTPS, com autenticação baseada em tokens emitidos pelo Firebase.

## Frontend

- **Layout**: estrutura 3 colunas (sidebar fixa, topbar e área de conteúdo) conforme PRD.
- **Estado global**: ainda não definido; sugerido uso futuro de React Query para dados remotos e Zustand/Context para preferências.
- **Tema**: `ThemeProvider` gerencia modo escuro/claro com persistência em `localStorage`.
- **Rotas principais**:
  - `/` — Dashboard
  - `/cadastros/*` — Hóspedes / Empresas
  - `/quartos/*` — Visão geral / Manutenção
  - `/reservas/*` — Movimentos / Lista / Calendário
  - `/financeiro/*` — Dashboard / Receitas / Despesas
  - `/admin/*` — Consultor IA / Configurações
- **Componentes reutilizáveis**: `KpiCard`, `Card`, `StatusBadge`, além de layout.

## Backend

- **Estrutura**: FastAPI com routers por módulo (`dashboard`, `guests`, `reservations`, etc.).
- **Configuração**: `Settings` via `pydantic.BaseSettings`, suporta `.env`.
- **Integração Firebase**: `app/core/firebase.py` centraliza inicialização simples da SDK Admin.
- **Mock data**: endpoints retornam dados estáticos para viabilizar desenvolvimento do frontend.
- **Dependências principais**: `fastapi`, `pydantic v2`, `firebase-admin`, `google-cloud-firestore`, `uvicorn`.

## Segurança & Autenticação

- Login previsto com Firebase Authentication (usuário e senha).
- Respostas já devolvem payload com `access_token` e dados do usuário para consumo inicial.
- Futuros endpoints devem validar tokens Firebase em middleware/dependência dedicada.

## Banco de Dados

- Firestore como base de documentos; modelos Pydantic representam estrutura esperada:
  - Hóspedes, Empresas, Quartos, Reservas, Despesas, Usuários, Papéis.
- Necessário mapear coleções (ex.: `guests`, `companies`, `rooms`, `reservations`, `expenses`, `users`, `roles`).
- Sugestão: camada de repositórios para abstrair Firestore e permitir testes unitários.

## Observações

- Nenhum código de produção consome APIs reais ainda; endpoints retornam mock para validar UI.
- Tailwind configurado com modo escuro (`dark` como classe raiz) e paleta customizada.
- Estrutura pronta para CI/CD simples: instalar deps do backend, rodar `pytest`; instalar deps do frontend, rodar `npm run build`.

## Próximas Integrações

- Implementar autenticação real (Firebase) e proteção das rotas.
- Substituir mocks por repositórios Firestore.
- Ajustar serializers para refletir dados reais (ex.: datas como `datetime`).
- Criar camadas de serviço para regras específicas (ocupação, análises financeiras, AI).
