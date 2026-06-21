# AGENTS.md - Guia rápido para agentes OpenCode

## Comandos de desenvolvimento

- **Iniciar servidor dev**: `bun run dev` → http://localhost:8080 (porta fixa no Vite config)
- **Executar testes**: `bun run test`
- **Testes em watch mode**: `bun run test:watch`
- **Lint**: `bun run lint`
- **Preview build**: `bun run preview`
- **Build produção**: `bun run build`
- **Build desenvolvimento**: `bun run build:dev`
- **Sem script `typecheck`**: não existe `bun run typecheck`. Use `tsc --noEmit` diretamente

## Tecnologias

- **Runtime**: Bun (lockfile é `bun.lock` — não usar npm/yarn)
- **Build**: Vite + `@vitejs/plugin-react-swc`
- **Framework**: React 18 + TypeScript + Tailwind CSS
- **Componentes**: shadcn/ui com Radix UI (`/src/components/ui`)
- **Estado**: React Query (TanStack Query) via `QueryClient` em `App.tsx`
- **Roteamento**: React Router DOM v6 (lazy loading em todas as páginas)
- **Testes**: Vitest (jsdom) + `@testing-library/react` + Playwright para E2E
- **Formulários**: react-hook-form + zod
- **Animações**: framer-motion
- **Ícones**: lucide-react

## Integração Supabase (CRÍTICO)

- **NÃO chame Supabase diretamente** — use as funções encapsuladas em `src/lib/api.ts`
- Cliente configurado: `import { supabase } from "@/integrations/supabase/client"`
- Variáveis de ambiente obrigatórias (prefixo `VITE_`):
  ```
  VITE_SUPABASE_URL=https://...supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
  VITE_SUPABASE_PROJECT_ID=seu-id
  ```
- **RLS é obrigatório**: políticas de segurança em nível de linha

### Funções em `src/lib/api.ts`
- `checkStatus(orderId)` → via `reseller-proxy`
- `getEvents(orderId)` → via `reseller-proxy`
- `listOrders(limit)` → via `reseller-proxy`
- `createPixPayment(orderId, amount, credits, email?, orderType?)` → `create-pix-payment`
- `checkPixStatus(orderId)` → `check-pix-status`
- `proxyApiStatus(apiOrderId)` → `proxy-api-status`
- `walletPurchase(credits)` → `wallet-purchase`
- `clientWalletPurchase(credits)` → `client-wallet-purchase`

### Edge Functions (20 em `/supabase/functions/`)
`admin-list-users`, `admin-manage-user`, `admin-reset-password`, `check-pix-status`, `client-wallet-purchase`, `create-pix-payment`, `generate-seo-page`, `get-pricing`, `mercadopago-webhook`, `optimize-cluster`, `process-refund`, `process-reseller-delivery`, `proxy-api-status`, `reseller-ai`, `reseller-proxy`, `send-bulk-email`, `send-welcome-email`, `seo-autopilot`, `sync-pricing`, `wallet-purchase`

## Estrutura de diretórios

- **`/src/pages`** – páginas com lazy loading (React Router)
  - Públicas: `/` (BuyCredits), `/login`, `/register`, `/como-funciona`
  - Protegidas (ProtectedRoute): `/dashboard`, `/revenda`, `/history`
  - Admin (AdminRoute): `/painel-x7k9m`
  - SEO dinâmico: `/s/:slug`, `/creditos/*`, `/lovable/*`, `/criar-app/*`, `/vibe-coding/*`
  - Revendedores públicos: `/r/:slug`, `/r/:slug/:packSlug`
- **`/src/components/ui`** – shadcn/ui (não tocar sem necessidade)
- **`/src/components`** – componentes de aplicação
- **`/src/contexts`** – AuthContext, MetricsContext
- **`/src/hooks`** – usePricing, useNotifications, useSmartPolling, etc.
- **`/src/lib`** – utilitários e wrappers de API (`api.ts`, `pricing.ts`, `whatsapp.ts`)
- **`/src/integrations`** – configuração Supabase (cliente + tipos gerados)
- **`/supabase/functions`** – Edge Functions (TypeScript, rodadas no Supabase)
- **`/supabase/migrations`** – migrações SQL do banco

## Armadilhas importantes

1. **Bun obrigatório**: apesar do `package.json` parecer npm, o projeto usa Bun
2. **lovable-tagger**: plugin só ativa em `mode === "development"` (vite.config.ts)
3. **Variáveis de ambiente**: precisam do prefixo `VITE_` para serem expostas pelo Vite
4. **TypeScript relaxado**: `strictNullChecks: false`, `noImplicitAny: false`
5. **ESLint**: `no-unused-vars` está OFF, `react-refresh/only-export-components` warn
6. **MetricsContext**: emite eventos de analytics reais — usar com moderação em dev
7. **Alias `@`**: resolve para `./src` (configurado em vite.config.ts e tsconfig)
8. **Deduplication**: Vite deduplica react, react-dom, e @tanstack packages (vite.config.ts)

## Verificação após alterações

1. `bun run lint`
2. `tsc --noEmit`
3. `bun run test`
4. `bun run dev` e teste no navegador (http://localhost:8080)

## Regras de roteamento

- `ProtectedRoute` → exige autenticação via Supabase Auth
- `AdminRoute` → exige role de admin (verifica `isAdmin` no AuthContext)
- `SeoRouter` → renderiza templates dinâmicos baseados em slug
- Páginas de revendedor público (`/r/:slug`) não mostram Header nem WhatsAppButton

## Banco de dados

- Acesse Supabase Studio ou CLI para migrações e consultas diretas
- Migrações via Supabase Dashboard ou CLI oficial (não via código)
- Cliente Supabase pre-configurado com persistência em `localStorage`
