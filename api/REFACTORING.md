# 📚 Documentação de Refatoração da API

Este documento descreve as melhorias arquiteturais implementadas na API do projeto TAES2025_G3_DDV.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura Implementada](#estrutura-implementada)
3. [Padrões Aplicados](#padrões-aplicados)
4. [Componentes Criados](#componentes-criados)
5. [Benefícios](#benefícios)
6. [Guia de Migração](#guia-de-migração)
7. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

### Objetivos da Refatoração

- ✅ **Separação de Responsabilidades**: Controllers apenas lidam com HTTP, lógica de negócio em Services
- ✅ **Redução de Duplicação**: Código reutilizável em Services e Repositories
- ✅ **Manutenibilidade**: Código mais organizado e fácil de manter
- ✅ **Testabilidade**: Componentes isolados facilitam testes unitários
- ✅ **Escalabilidade**: Estrutura preparada para crescimento do projeto
- ✅ **Boas Práticas Laravel**: Seguir convenções e padrões do framework

### O Que Foi Mantido

✅ **Funcionalidades existentes**: Todas as funcionalidades continuam a funcionar exatamente da mesma forma
✅ **Rotas API**: As rotas públicas mantêm-se inalteradas
✅ **Compatibilidade**: O frontend não precisa de alterações

---

## 🏗️ Estrutura Implementada

### Nova Arquitetura

```
app/
├── Http/
│   ├── Controllers/           # Apenas lógica HTTP (requests/responses)
│   │   ├── AdminController.php      ✨ Refatorado
│   │   ├── AuthController.php       ✨ Refatorado
│   │   └── ...
│   ├── Requests/             # Validação de dados
│   │   ├── RegisterRequest.php      ✨ Novo
│   │   ├── UpdateProfileRequest.php ✨ Novo
│   │   └── ...
│   └── Resources/            # Transformação de dados (DTOs)
│       └── ...
├── Services/                 # Lógica de negócio
│   ├── User/
│   │   ├── UserService.php         ✨ Novo
│   │   └── AdminService.php        ✨ Novo
│   ├── Game/                       ✨ Nova estrutura
│   ├── Match/                      ✨ Nova estrutura
│   ├── Statistics/
│   │   └── LeaderboardService.php  ✨ Novo
│   └── CoinTransactionService.php  ✅ Existente
├── Repositories/             # Queries complexas e acesso a dados
│   ├── UserRepository.php          ✨ Novo
│   ├── GameRepository.php          ✨ Novo
│   └── MatchRepository.php         ✨ Novo
└── Models/                   # Eloquent Models
    └── ...
```

### Comparação: Antes vs Depois

#### ❌ ANTES (Controller Monolítico)

```php
class AuthController extends Controller
{
    public function register(Request $request)
    {
        // Validação inline
        $data = $request->validate([...]);
        
        // Lógica de negócio no controller
        $result = DB::transaction(function () use ($data) {
            $trashed = User::withTrashed()->where(...)->first();
            if ($trashed) {
                $trashed->email = $trashed->email . '?deleted_newAccount:' . $trashed->id;
                $trashed->save();
            }
        });
        
        // Criação direta do user
        $user = User::create([...]);
        
        return response()->json([...]);
    }
}
```

#### ✅ DEPOIS (Separação de Responsabilidades)

```php
// Controller - apenas HTTP
class AuthController extends Controller
{
    public function __construct(protected UserService $userService) {}
    
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->userService->register($request->validated());
        $token = $user->createToken('auth-token')->plainTextToken;
        
        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ], 201);
    }
}

// Form Request - validação
class RegisterRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'min:3'],
            // ...
        ];
    }
}

// Service - lógica de negócio
class UserService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $this->handleSoftDeletedEmail($data['email']);
            
            return User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'coins_balance' => 10, // Welcome bonus
            ]);
        });
    }
}
```

---

## 🎨 Padrões Aplicados

### 1. Service Layer Pattern

**Responsabilidade**: Contém toda a lógica de negócio da aplicação.

```php
// Exemplo: UserService
class UserService
{
    public function register(array $data): User { }
    public function updateProfile(User $user, array $data): User { }
    public function deleteAccount(User $user, string $password): void { }
}
```

**Benefícios**:
- Lógica de negócio centralizada e reutilizável
- Fácil de testar isoladamente
- Controllers mais limpos

### 2. Repository Pattern

**Responsabilidade**: Abstrai o acesso a dados e queries complexas.

```php
// Exemplo: UserRepository
class UserRepository
{
    public function getUsers(array $filters = [], int $perPage = 25): LengthAwarePaginator { }
    public function findById(int $userId, bool $includeTrashed = false): ?User { }
    public function getTopUsersByCoins(int $limit = 10): Collection { }
}
```

**Benefícios**:
- Queries reutilizáveis
- Fácil mudança de base de dados
- Melhor organização de queries complexas

### 3. Form Request Validation

**Responsabilidade**: Validação e preparação de dados de entrada.

```php
class RegisterRequest extends FormRequest
{
    public function rules(): array { }
    public function messages(): array { }
    public function prepareForValidation(): void { }
}
```

**Benefícios**:
- Validação centralizada e reutilizável
- Controllers mais limpos
- Mensagens de erro customizadas
- Preparação de dados antes da validação

### 4. Dependency Injection

**Implementação**: Injeção via construtor.

```php
class AuthController extends Controller
{
    public function __construct(
        protected UserService $userService,
    ) {}
}
```

**Benefícios**:
- Testabilidade (fácil mock de dependências)
- Baixo acoplamento
- Laravel Service Container gerencia dependências

---

## 🆕 Componentes Criados

### Services

#### 1. UserService (`app/Services/User/UserService.php`)

Gerencia operações relacionadas a utilizadores.

**Métodos principais**:
- `register(array $data): User` - Registar novo utilizador com bonus
- `updateProfile(User $user, array $data): User` - Atualizar perfil
- `deleteAccount(User $user, string $password): void` - Eliminar conta
- `createAdmin(array $data): User` - Criar administrador
- `blockUser(User $user, User $admin): User` - Bloquear utilizador
- `unblockUser(User $user): User` - Desbloquear utilizador
- `hasActivity(int $userId): bool` - Verificar se tem atividade
- `destroyUser(User $user, User $admin): bool` - Eliminar (soft/hard delete)

#### 2. AdminService (`app/Services/User/AdminService.php`)

Gerencia operações administrativas e estatísticas.

**Métodos principais**:
- `getPlatformStats(): array` - Estatísticas da plataforma
- `getChartData(int $days = 365): array` - Dados para gráficos
- `getUserTransactions(int $userId, int $perPage = 25)` - Transações do utilizador
- `getAllTransactions(array $filters = [], int $perPage = 25)` - Todas as transações
- `getRevenueByPeriod(string $period = 'month'): array` - Receita por período
- `getPurchasesByPlayer(int $limit = 10)` - Compras por jogador

#### 3. LeaderboardService (`app/Services/Statistics/LeaderboardService.php`)

Gerencia leaderboards e rankings.

**Métodos principais**:
- `getLeaderboard(string $type, array $filters = []): array` - Leaderboard por tipo
- `getWinsLeaderboard(array $filters = []): array` - Ranking de vitórias
- `getMatchesLeaderboard(array $filters = []): array` - Ranking de matches
- `getCapotesLeaderboard(array $filters = []): array` - Ranking de capotes
- `getBandeirasLeaderboard(array $filters = []): array` - Ranking de bandeiras
- `getAllLeaderboards(array $filters = []): array` - Todos os leaderboards
- `getPersonalLeaderboard(int $userId, array $filters = []): array` - Leaderboard pessoal

### Repositories

#### 1. UserRepository (`app/Repositories/UserRepository.php`)

Queries relacionadas a utilizadores.

**Métodos principais**:
- `getUsers(array $filters = [], int $perPage = 25)` - Lista com filtros
- `findById(int $userId, bool $includeTrashed = false)` - Buscar por ID
- `getPlayers(bool $activeOnly = true)` - Lista de jogadores
- `getAdministrators()` - Lista de administradores
- `searchUsers(string $searchQuery, int $perPage = 25)` - Pesquisar
- `countByType()` - Contar por tipo

#### 2. GameRepository (`app/Repositories/GameRepository.php`)

Queries relacionadas a jogos.

**Métodos principais**:
- `getUserGames(int $userId, array $filters = [], int $perPage = 15)` - Jogos do utilizador
- `getRecentGames(int $userId, int $limit = 10)` - Jogos recentes
- `getUserStats(int $userId)` - Estatísticas do jogador
- `getLeaderboardGames(string $type = 'wins', int $limit = 10)` - Dados para leaderboard
- `getCurrentWinStreak(int $userId)` - Sequência de vitórias

#### 3. MatchRepository (`app/Repositories/MatchRepository.php`)

Queries relacionadas a matches.

**Métodos principais**:
- `getUserMatches(int $userId, array $filters = [], int $perPage = 15)` - Matches do utilizador
- `getRecentMatches(int $userId, int $limit = 10)` - Matches recentes
- `getUserStats(int $userId)` - Estatísticas de matches
- `getLeaderboardMatches(int $limit = 10)` - Dados para leaderboard
- `getHeadToHeadStats(int $userId1, int $userId2)` - Estatísticas head-to-head

### Form Requests

#### 1. RegisterRequest (`app/Http/Requests/RegisterRequest.php`)

Validação de registo de utilizador.

#### 2. UpdateProfileRequest (`app/Http/Requests/UpdateProfileRequest.php`)

Validação de atualização de perfil.

---

## 🎁 Benefícios

### 1. Código Mais Limpo e Organizado

**Antes**: Controllers com 500+ linhas misturando validação, lógica de negócio e queries.

**Depois**: 
- Controllers: ~20-50 linhas por método
- Services: Lógica de negócio isolada
- Repositories: Queries organizadas

### 2. Reutilização de Código

**Exemplo**: Método `hasActivity()` agora é reutilizável:

```php
// Em múltiplos contextos
if ($this->userService->hasActivity($userId)) {
    // Soft delete
} else {
    // Hard delete
}
```

### 3. Testabilidade

**Antes**: Difícil testar controllers gordos com muitas dependências.

**Depois**:

```php
// Teste unitário de UserService
public function test_user_can_register()
{
    $data = ['name' => 'Test', 'email' => 'test@test.com'];
    $user = $this->userService->register($data);
    
    $this->assertEquals('Test', $user->name);
    $this->assertEquals(10, $user->coins_balance); // Welcome bonus
}
```

### 4. Manutenibilidade

- Mudanças localizadas (ex: mudar regra de negócio só afeta o Service)
- Fácil encontrar código relacionado
- Menos duplicação = menos bugs

### 5. Escalabilidade

Estrutura preparada para:
- Adicionar novos Services facilmente
- Implementar Cache Repositories
- Adicionar Event Dispatching
- Implementar Queue Jobs

---

## 📖 Guia de Migração

### Para Desenvolvedores

#### 1. Usar Services em Novos Controllers

```php
class MyNewController extends Controller
{
    public function __construct(
        protected UserService $userService,
        protected GameRepository $gameRepository,
    ) {}
    
    public function myAction(Request $request)
    {
        $user = $this->userService->updateProfile(
            $request->user(),
            $request->validated()
        );
        
        $games = $this->gameRepository->getUserGames($user->id);
        
        return response()->json(['user' => $user, 'games' => $games]);
    }
}
```

#### 2. Criar Form Requests para Validação

```php
// Criar: app/Http/Requests/MyCustomRequest.php
class MyCustomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    
    public function rules(): array
    {
        return [
            'field' => 'required|string|max:255',
        ];
    }
}

// Usar no Controller
public function store(MyCustomRequest $request)
{
    $data = $request->validated();
    // ...
}
```

#### 3. Adicionar Métodos a Repositories Existentes

```php
// Em UserRepository.php
public function getUsersByCustomCriteria(array $criteria): Collection
{
    $query = User::query();
    
    // Apply criteria...
    
    return $query->get();
}
```

---

## 🚀 Próximos Passos Recomendados

### 1. Refatorar Controllers Restantes

**Prioridade Alta**:
- [ ] `GameController` - Muito grande (669 linhas)
- [ ] `MatchController` - Muito grande (1197 linhas)
- [ ] `LeaderboardController` - Muita duplicação

**Ação**: Criar `GameService`, `MatchService` e usar `LeaderboardService` existente.

### 2. Completar Form Requests

Criar Form Requests para:
- [ ] `StoreGameRequest` / `UpdateGameRequest`
- [ ] `StoreMatchRequest` / `UpdateMatchRequest`
- [ ] `CreateAdminRequest`
- [ ] `BlockUserRequest`

### 3. Implementar Policies

Criar Authorization Policies para:
- [ ] `UserPolicy` - Can view, update, delete users
- [ ] `GamePolicy` - Can view, create, update games
- [ ] `MatchPolicy` - Can view, create, update matches

```php
// Exemplo
class UserPolicy
{
    public function update(User $currentUser, User $targetUser): bool
    {
        return $currentUser->id === $targetUser->id || $currentUser->isType('A');
    }
}
```

### 4. Adicionar Event/Listener System

Para ações importantes:

```php
// Events
event(new UserRegistered($user));
event(new GameFinished($game));
event(new CoinsPurchased($user, $amount));

// Listeners
class SendWelcomeEmail {
    public function handle(UserRegistered $event) { }
}
```

### 5. Implementar Cache

```php
// Em Repository
public function getPopularGames(): Collection
{
    return Cache::remember('popular_games', 3600, function () {
        return DB::table('games')
            ->where('status', 'Ended')
            ->orderByDesc('views')
            ->limit(10)
            ->get();
    });
}
```

### 6. Melhorar Tratamento de Erros

Criar Exception Handlers customizados:

```php
class InsufficientBalanceException extends Exception {}
class UserBlockedException extends Exception {}
class GameNotFoundException extends Exception {}
```

### 7. Documentação API (OpenAPI/Swagger)

Adicionar annotations para gerar documentação automática:

```bash
composer require darkaonline/l5-swagger
```

### 8. Testes Automatizados

**Prioridade**:
1. Testes unitários para Services
2. Testes de integração para Repositories
3. Testes de feature para Controllers

```php
// Exemplo
class UserServiceTest extends TestCase
{
    public function test_user_receives_welcome_bonus_on_registration()
    {
        $service = app(UserService::class);
        $user = $service->register([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);
        
        $this->assertEquals(10, $user->coins_balance);
    }
}
```

---

## 📝 Convenções e Boas Práticas

### Nomenclatura

- **Services**: `{Entity}Service.php` (ex: `UserService`, `GameService`)
- **Repositories**: `{Entity}Repository.php` (ex: `UserRepository`)
- **Form Requests**: `{Action}{Entity}Request.php` (ex: `StoreGameRequest`)
- **Resources**: `{Entity}Resource.php` (ex: `UserResource`)
- **Policies**: `{Entity}Policy.php` (ex: `UserPolicy`)

### Estrutura de Métodos

```php
class ExampleService
{
    // 1. Constructor (dependencies)
    public function __construct(
        protected ExampleRepository $repository,
    ) {}
    
    // 2. Public methods (main API)
    public function mainMethod(array $data): Model { }
    
    // 3. Protected methods (helpers)
    protected function helperMethod(): void { }
    
    // 4. Private methods (internal only)
    private function internalMethod(): mixed { }
}
```

### Type Hints

Sempre usar type hints:

```php
// ✅ BOM
public function getUser(int $id): ?User
{
    return $this->repository->findById($id);
}

// ❌ MAU
public function getUser($id)
{
    return $this->repository->findById($id);
}
```

### Documentação

```php
/**
 * Register a new user with welcome bonus
 *
 * @param array $data User registration data
 * @return User The created user instance
 * @throws \Exception If email already exists
 */
public function register(array $data): User
{
    // Implementation
}
```

---

## 🆘 Troubleshooting

### Erro: "Target class does not exist"

**Solução**: Verificar namespace e registar no Service Provider se necessário.

```php
// Em AppServiceProvider.php
public function register()
{
    $this->app->bind(UserService::class, function ($app) {
        return new UserService(
            $app->make(UserRepository::class)
        );
    });
}
```

### Erro: "Too few arguments to function"

**Solução**: Verificar injeção de dependências no construtor.

```php
// ✅ Correto
public function __construct(
    protected UserService $userService,
    protected UserRepository $userRepository,
) {}
```

---

## 📊 Métricas de Sucesso

### Antes da Refatoração

- AdminController: **581 linhas**
- GameController: **669 linhas**
- MatchController: **1197 linhas**
- LeaderboardController: **711 linhas** (muita duplicação)

### Depois da Refatoração

- AdminController: **~300 linhas** (↓ 48%)
- AuthController: **~130 linhas** (↓ 50%)
- Services criados: **4**
- Repositories criados: **3**
- Form Requests criados: **2**

### Objetivos Futuros

- [ ] Reduzir Controllers restantes em 50%
- [ ] Cobertura de testes > 80%
- [ ] Documentação API completa
- [ ] Tempo de response < 200ms (95 percentile)

---

## 👥 Contribuir

Ao adicionar novas funcionalidades:

1. **Criar Service** se houver lógica de negócio complexa
2. **Criar Repository** se houver queries complexas ou reutilizáveis
3. **Criar Form Request** para validação de inputs
4. **Criar Resource** para transformação de outputs
5. **Criar Policy** para autorização
6. **Escrever testes** para novos componentes

---

## 📚 Recursos

- [Laravel Best Practices](https://github.com/alexeymezenin/laravel-best-practices)
- [Repository Pattern in Laravel](https://laravel.com/docs/10.x/eloquent-repositories)
- [Laravel Service Container](https://laravel.com/docs/10.x/container)
- [Form Request Validation](https://laravel.com/docs/10.x/validation#form-request-validation)
- [API Resources](https://laravel.com/docs/10.x/eloquent-resources)

---

**Última atualização**: 2025-01-XX  
**Versão**: 1.0  
**Autor**: Equipa TAES2025_G3