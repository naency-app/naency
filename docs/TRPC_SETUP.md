# Configuração do tRPC

Este projeto está configurado com tRPC para fornecer tipagem end-to-end entre o cliente e servidor.

## Estrutura de Arquivos

```
server/
├── trpc.ts              # Configuração base do tRPC
├── routers/
│   ├── _app.ts         # Router principal
│   ├── user.ts         # Router de usuários
│   └── categories.ts   # Router de categorias
app/
├── api/trpc/[trpc]/route.ts  # API route do tRPC
lib/
├── trpc.ts             # Cliente tRPC
├── trpc-provider.tsx   # Provider do tRPC
types/
└── trpc.ts             # Tipos compartilhados
```

## Como Usar

### 1. Queries (Leitura de Dados)

```tsx
import { trpc } from "@/lib/trpc";

function MyComponent() {
  const { data, isLoading, error } = trpc.user.getAll.useQuery();
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  
  return (
    <div>
      {data?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### 2. Mutations (Modificação de Dados)

```tsx
import { trpc } from "@/lib/trpc";

function CreateUserForm() {
  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      // Sucesso
    },
    onError: (error) => {
      // Erro
    },
  });

  const handleSubmit = (data) => {
    createUser.mutate(data);
  };
}
```

### 3. Invalidação de Cache

```tsx
const utils = trpc.useUtils();

// Após uma mutation bem-sucedida
utils.user.getAll.invalidate();
```

## Adicionando Novos Routers

1. Crie um novo arquivo em `server/routers/`
2. Defina os procedimentos usando `publicProcedure`
3. Adicione o router ao `_app.ts`
4. Use no frontend com `trpc.nomeRouter.procedimento.useQuery()`

## Exemplo de Router

```tsx
// server/routers/example.ts
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const exampleRouter = router({
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Lógica do servidor
      return { id: input.id, name: 'Exemplo' };
    }),
    
  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      // Lógica de criação
      return { success: true };
    }),
});
```

## Benefícios

- **Tipagem End-to-End**: TypeScript funciona do cliente ao servidor
- **Validação Automática**: Zod valida inputs automaticamente
- **Cache Inteligente**: React Query gerencia cache automaticamente
- **Developer Experience**: IntelliSense completo e detecção de erros
- **Performance**: Batching automático de requests

## Dependências

- `@trpc/client` - Cliente tRPC
- `@trpc/server` - Servidor tRPC
- `@trpc/react-query` - Integração com React Query
- `@trpc/next` - Integração com Next.js
- `@tanstack/react-query` - Gerenciamento de estado e cache
- `zod` - Validação de schemas
