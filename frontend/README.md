# Frontend - Inn Management Tool

Aplicação React + TypeScript responsiva com Tailwind CSS para suporte aos módulos descritos no PRD.

## Scripts

- `npm run dev` — ambiente de desenvolvimento via Vite.
- `npm run build` — build de produção.
- `npm run preview` — preview do build.
- `npm run lint` — verificação de tipos (TS).

## Estrutura

- `src/components/layout` — layout principal (menu lateral, topo).
- `src/components/ui` — componentes reutilizáveis (cards, badges, KPI).
- `src/pages` — páginas referentes aos módulos (Dashboard, Cadastros, Quartos, Reservas, Financeiro, Admin).
- `src/providers` — provedores globais (ex.: tema).

## Tailwind

O Tailwind está configurado com modo escuro por classe (`dark`) e cores primárias personalizadas para seguir o visual do PRD.

## Próximos Passos

- Conectar as páginas aos endpoints reais do backend.
- Implementar estados/armazenamento global (React Query ou Zustand).
- Adicionar testes de interface (React Testing Library).
