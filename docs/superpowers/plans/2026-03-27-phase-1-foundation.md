# MidFlix Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the full-stack foundation — Laravel 12 API with MongoDB auth, React 18 SPA scaffold, role-based protected routing, and GitHub Actions CI.

**Architecture:** Laravel 12 REST API backed by local MongoDB + Redis, Sanctum token auth stored in localStorage, Spatie RBAC with `admin` and `subscriber` roles. React 18 SPA with Zustand auth state, TanStack Query, React Router v6 protected routes. Docker Compose orchestrates all services locally.

**Tech Stack:** Laravel 12, PHP 8.3, MongoDB 7, Redis 7, Laravel Sanctum, Spatie Permission, Laravel Horizon, Pest, React 18, Vite, TypeScript strict, Tailwind CSS v3, Shadcn/ui, Zustand, TanStack Query v5, React Router v6, React Hook Form, Zod, Vitest

---

## File Map

### Backend — `backend/`
```
backend/
├── Dockerfile
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/AuthController.php
│   │   ├── Middleware/CheckSubscriberAccess.php
│   │   ├── Requests/Auth/
│   │   │   ├── RegisterRequest.php
│   │   │   ├── LoginRequest.php
│   │   │   ├── ForgotPasswordRequest.php
│   │   │   └── ResetPasswordRequest.php
│   │   └── Resources/UserResource.php
│   ├── Models/User.php
│   └── Services/AuthService.php
├── bootstrap/app.php                  (modify — register middleware alias)
├── config/database.php                (modify — add mongodb connection)
├── database/seeders/RoleSeeder.php
├── routes/api.php
└── tests/Feature/Auth/
    ├── RegisterTest.php
    ├── LoginTest.php
    └── MeTest.php
```

### Frontend — `frontend/`
```
frontend/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   ├── axios.ts
│   │   └── auth.ts
│   ├── components/ui/                 (Shadcn — generated)
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   ├── MainLayout.tsx
│   │   └── AdminLayout.tsx
│   ├── lib/
│   │   ├── cn.ts
│   │   └── constants.ts
│   ├── pages/auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── router/
│   │   ├── index.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── GuestRoute.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   └── types/
│       └── user.ts
```

### Root
```
MidFlix/
├── docker-compose.yml
├── docker/nginx/default.conf
├── .github/workflows/ci.yml
├── backend/
└── frontend/
```

---

## Task 1: Project Structure + Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `docker/nginx/default.conf`
- Create: `backend/Dockerfile`

- [ ] **Step 1: Create root project structure**

```bash
mkdir -p docker/nginx
```

- [ ] **Step 2: Create `docker-compose.yml`**

```yaml
version: '3.8'

services:
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: midflix_app
    restart: unless-stopped
    working_dir: /var/www/html
    volumes:
      - ./backend:/var/www/html
    networks:
      - midflix
    depends_on:
      - mongodb
      - redis

  nginx:
    image: nginx:alpine
    container_name: midflix_nginx
    restart: unless-stopped
    ports:
      - "8000:80"
    volumes:
      - ./backend:/var/www/html
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
    networks:
      - midflix
    depends_on:
      - app

  mongodb:
    image: mongo:7
    container_name: midflix_mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - midflix

  redis:
    image: redis:7-alpine
    container_name: midflix_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - midflix

  horizon:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: midflix_horizon
    restart: unless-stopped
    working_dir: /var/www/html
    command: php artisan horizon
    volumes:
      - ./backend:/var/www/html
    networks:
      - midflix
    depends_on:
      - mongodb
      - redis

networks:
  midflix:
    driver: bridge

volumes:
  mongodb_data:
```

- [ ] **Step 3: Create `docker/nginx/default.conf`**

```nginx
server {
    listen 80;
    index index.php index.html;
    root /var/www/html/public;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass app:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

- [ ] **Step 4: Create `backend/Dockerfile`**

```dockerfile
FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev \
    zip unzip ffmpeg libssl-dev \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && docker-php-ext-install pdo mbstring exif pcntl bcmath gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader 2>/dev/null || true

RUN chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

EXPOSE 9000
CMD ["php-fpm"]
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml docker/ backend/Dockerfile
git commit -m "feat: add Docker Compose setup with MongoDB, Redis, Nginx, Horizon"
```

---

## Task 2: Laravel 12 Installation + MongoDB + Redis Configuration

**Files:**
- Create: `backend/` (Laravel install)
- Modify: `backend/config/database.php`
- Modify: `backend/.env.example`

- [ ] **Step 1: Install Laravel 12 in `backend/`**

```bash
composer create-project laravel/laravel backend --prefer-dist
cd backend
```

- [ ] **Step 2: Install required packages**

```bash
composer require \
  mongodb/laravel-mongodb:^4.1 \
  laravel/sanctum:^4.0 \
  spatie/laravel-permission:^6.0 \
  spatie/laravel-activitylog:^4.0 \
  laravel/horizon:^5.0
```

- [ ] **Step 3: Install dev packages**

```bash
composer require --dev pestphp/pest:^2.0 pestphp/pest-plugin-laravel:^2.0
./vendor/bin/pest --init
```

- [ ] **Step 4: Add MongoDB connection to `config/database.php`**

Open `backend/config/database.php`. Add to the `connections` array:

```php
'mongodb' => [
    'driver' => 'mongodb',
    'dsn' => env('MONGODB_URI', 'mongodb://localhost:27017'),
    'database' => env('MONGODB_DATABASE', 'midflix'),
],
```

Set `'default' => env('DB_CONNECTION', 'mongodb')` at the top of `connections`.

- [ ] **Step 5: Create `backend/.env` from `.env.example` and configure**

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env`:
```env
APP_NAME=MidFlix
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=mongodb
MONGODB_URI=mongodb://midflix_mongodb:27017
MONGODB_DATABASE=midflix

CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=midflix_redis
REDIS_PORT=6379

SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

- [ ] **Step 6: Publish and configure Sanctum for API token mode**

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

In `config/sanctum.php`, verify `'guard' => ['web']` — leave as-is (Sanctum handles both SPA + token auth).

- [ ] **Step 7: Publish Spatie Permission config**

```bash
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
```

Edit `config/permission.php` — change the models to use MongoDB:
```php
'models' => [
    'permission' => Spatie\Permission\Models\Permission::class,
    'role' => Spatie\Permission\Models\Role::class,
],

'column_names' => [
    'role_pivot_key' => null,
    'permission_pivot_key' => null,
    'model_morph_key' => 'model_id',
    'team_foreign_key' => 'team_id',
],

'teams' => false,
'use_passport_client_credentials' => false,
'display_permission_in_exception' => false,
'display_role_in_exception' => false,
'enable_wildcard_permission' => false,

'cache' => [
    'expiration_time' => \DateInterval::createFromDateString('24 hours'),
    'key' => 'spatie.permission.cache',
    'store' => 'default',
],
```

- [ ] **Step 8: Publish Horizon**

```bash
php artisan horizon:install
```

- [ ] **Step 9: Register middleware alias in `bootstrap/app.php`**

Open `backend/bootstrap/app.php`. Add inside `->withMiddleware(function (Middleware $middleware) {`:

```php
$middleware->alias([
    'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
    'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
    'subscriber' => \App\Http\Middleware\CheckSubscriberAccess::class,
]);
```

- [ ] **Step 10: Verify Docker containers start**

```bash
cd /var/www/html/MidFlix
docker compose up -d
docker compose ps
```

Expected: all 5 containers `running`.

- [ ] **Step 11: Commit**

```bash
git add backend/
git commit -m "feat: install Laravel 12 with MongoDB, Sanctum, Spatie Permission, Horizon"
```

---

## Task 3: User Model

**Files:**
- Create: `backend/app/Models/User.php`

- [ ] **Step 1: Replace the default User model**

Replace the contents of `backend/app/Models/User.php`:

```php
<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Auth\Passwords\CanResetPassword as CanResetPasswordTrait;
use Illuminate\Notifications\Notifiable;

class User extends Model implements AuthenticatableContract, CanResetPassword
{
    use HasApiTokens, HasRoles, Authenticatable, CanResetPasswordTrait, Notifiable;

    protected $connection = 'mongodb';
    protected $collection = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'is_active',
        'email_verified_at',
        'subscription',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'subscription' => 'array',
        'password' => 'hashed',
    ];

    protected $attributes = [
        'is_active' => true,
        'subscription' => '{"plan":"free","status":"expired","trial_ends_at":null,"expires_at":null}',
    ];

    public function hasActiveSubscription(): bool
    {
        $subscription = $this->subscription;
        return in_array($subscription['status'] ?? 'expired', ['trial', 'active']);
    }
}
```

- [ ] **Step 2: Add User factory for tests**

Open `backend/database/factories/UserFactory.php` and replace:

```php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'is_active' => true,
            'email_verified_at' => now(),
            'subscription' => [
                'plan' => 'free',
                'status' => 'expired',
                'trial_ends_at' => null,
                'expires_at' => null,
            ],
        ];
    }

    public function subscriber(): static
    {
        return $this->state(fn () => [
            'subscription' => [
                'plan' => 'basic',
                'status' => 'active',
                'trial_ends_at' => null,
                'expires_at' => now()->addMonth(),
            ],
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['email' => 'admin@midflix.com']);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/Models/User.php backend/database/factories/UserFactory.php
git commit -m "feat: User model with MongoDB, Sanctum, Spatie roles, subscription embedded doc"
```

---

## Task 4: Auth API — Register Endpoint (TDD)

**Files:**
- Create: `backend/tests/Feature/Auth/RegisterTest.php`
- Create: `backend/app/Http/Requests/Auth/RegisterRequest.php`
- Create: `backend/app/Http/Resources/UserResource.php`
- Create: `backend/app/Services/AuthService.php`
- Create: `backend/app/Http/Controllers/Api/V1/AuthController.php`
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Write the failing register tests**

Create `backend/tests/Feature/Auth/RegisterTest.php`:

```php
<?php

use App\Models\User;

test('user can register with valid data', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'success',
            'data' => [
                'user' => ['id', 'name', 'email', 'subscription'],
                'token',
            ],
            'message',
        ])
        ->assertJson(['success' => true]);
});

test('register fails with duplicate email', function () {
    User::factory()->create(['email' => 'jane@example.com']);

    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(422)
        ->assertJson(['success' => false, 'error_code' => 'VALIDATION_ERROR']);
});

test('register fails when password too short', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => '123',
        'password_confirmation' => '123',
    ]);

    $response->assertStatus(422);
});

test('register fails when password confirmation does not match', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'password123',
        'password_confirmation' => 'different',
    ]);

    $response->assertStatus(422);
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd backend && ./vendor/bin/pest tests/Feature/Auth/RegisterTest.php
```

Expected: FAIL — route not found (404).

- [ ] **Step 3: Create `RegisterRequest`**

Create `backend/app/Http/Requests/Auth/RegisterRequest.php`:

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
```

- [ ] **Step 4: Create `UserResource`**

Create `backend/app/Http/Resources/UserResource.php`:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->_id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar,
            'role' => $this->getRoleNames()->first() ?? 'subscriber',
            'is_active' => $this->is_active,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'subscription' => $this->subscription,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
```

- [ ] **Step 5: Create `AuthService`**

Create `backend/app/Services/AuthService.php`:

```php
<?php

namespace App\Services;

use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Register a new subscriber.
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $user->assignRole('subscriber');

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => new UserResource($user),
            'token' => $token,
        ];
    }

    /**
     * Authenticate and return token.
     *
     * @throws ValidationException
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => new UserResource($user),
            'token' => $token,
        ];
    }
}
```

- [ ] **Step 6: Create `AuthController`**

Create `backend/app/Http/Controllers/Api/V1/AuthController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Account created successfully',
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->email,
            $request->password
        );

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Login successful',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()),
            'message' => 'User retrieved successfully',
        ]);
    }
}
```

- [ ] **Step 7: Create `LoginRequest`**

Create `backend/app/Http/Requests/Auth/LoginRequest.php`:

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
```

- [ ] **Step 8: Register auth routes in `routes/api.php`**

Replace the contents of `backend/routes/api.php`:

```php
<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Public auth routes
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

});
```

- [ ] **Step 9: Run tests — verify they pass**

```bash
./vendor/bin/pest tests/Feature/Auth/RegisterTest.php
```

Expected: 4 passed.

- [ ] **Step 10: Commit**

```bash
git add app/ routes/ tests/Feature/Auth/RegisterTest.php
git commit -m "feat: register endpoint with TDD — FormRequest, Service, Resource pattern"
```

---

## Task 5: Auth API — Login + Logout (TDD)

**Files:**
- Create: `backend/tests/Feature/Auth/LoginTest.php`

- [ ] **Step 1: Write the failing login tests**

Create `backend/tests/Feature/Auth/LoginTest.php`:

```php
<?php

use App\Models\User;

test('user can login with correct credentials', function () {
    $user = User::factory()->create(['email' => 'test@example.com']);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'test@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'data' => ['user', 'token'],
        ])
        ->assertJson(['success' => true]);
});

test('login fails with wrong password', function () {
    User::factory()->create(['email' => 'test@example.com']);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'test@example.com',
        'password' => 'wrongpassword',
    ]);

    $response->assertStatus(422)
        ->assertJson(['success' => false]);
});

test('login fails with non-existent email', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'nobody@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(422);
});

test('authenticated user can logout', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer $token")
        ->postJson('/api/v1/auth/logout');

    $response->assertStatus(200)->assertJson(['success' => true]);
});

test('logout requires authentication', function () {
    $this->postJson('/api/v1/auth/logout')
        ->assertStatus(401);
});
```

- [ ] **Step 2: Run tests — verify they pass (login routes already wired)**

```bash
./vendor/bin/pest tests/Feature/Auth/LoginTest.php
```

Expected: 5 passed.

- [ ] **Step 3: Write Me endpoint test**

Create `backend/tests/Feature/Auth/MeTest.php`:

```php
<?php

use App\Models\User;

test('authenticated user can get their profile', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer $token")
        ->getJson('/api/v1/auth/me');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'data' => ['id', 'name', 'email', 'role', 'subscription'],
        ])
        ->assertJson(['success' => true]);
});

test('unauthenticated user cannot get profile', function () {
    $this->getJson('/api/v1/auth/me')->assertStatus(401);
});
```

- [ ] **Step 4: Run — verify they pass**

```bash
./vendor/bin/pest tests/Feature/Auth/MeTest.php
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add tests/Feature/Auth/LoginTest.php tests/Feature/Auth/MeTest.php
git commit -m "feat: login, logout, me endpoints — all tests passing"
```

---

## Task 6: Subscriber Access Middleware + Role Seeder

**Files:**
- Create: `backend/app/Http/Middleware/CheckSubscriberAccess.php`
- Create: `backend/database/seeders/RoleSeeder.php`
- Modify: `backend/database/seeders/DatabaseSeeder.php`

- [ ] **Step 1: Create `CheckSubscriberAccess` middleware**

Create `backend/app/Http/Middleware/CheckSubscriberAccess.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriberAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
                'error_code' => 'UNAUTHENTICATED',
            ], 401);
        }

        if (! $user->hasActiveSubscription()) {
            return response()->json([
                'success' => false,
                'message' => 'An active subscription is required',
                'error_code' => 'SUBSCRIPTION_REQUIRED',
            ], 403);
        }

        return $next($request);
    }
}
```

- [ ] **Step 2: Create `RoleSeeder`**

Create `backend/database/seeders/RoleSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $subscriberRole = Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'sanctum']);

        // Create default admin if not exists
        $admin = User::firstOrCreate(
            ['email' => 'admin@midflix.com'],
            [
                'name' => 'MidFlix Admin',
                'password' => Hash::make('admin123456'),
                'is_active' => true,
                'subscription' => [
                    'plan' => 'premium',
                    'status' => 'active',
                    'trial_ends_at' => null,
                    'expires_at' => null,
                ],
            ]
        );

        $admin->assignRole($adminRole);
    }
}
```

- [ ] **Step 3: Register seeder in `DatabaseSeeder`**

Open `backend/database/seeders/DatabaseSeeder.php` and update `run()`:

```php
public function run(): void
{
    $this->call([
        RoleSeeder::class,
    ]);
}
```

- [ ] **Step 4: Run seeder in Docker container**

```bash
docker compose exec app php artisan db:seed
```

Expected: `RoleSeeder` runs, admin user created.

- [ ] **Step 5: Verify roles exist**

```bash
docker compose exec app php artisan tinker --execute="echo \Spatie\Permission\Models\Role::count() . ' roles';"
```

Expected: `2 roles`

- [ ] **Step 6: Commit**

```bash
git add app/Http/Middleware/ database/seeders/
git commit -m "feat: subscriber access middleware and role seeder with default admin"
```

---

## Task 7: React 18 + Vite + TypeScript Scaffold

**Files:**
- Create: `frontend/` (entire scaffold)

- [ ] **Step 1: Scaffold React app with Vite**

```bash
cd /var/www/html/MidFlix
npm create vite@latest frontend -- --template react-ts
cd frontend
```

- [ ] **Step 2: Install dependencies**

```bash
npm install \
  react-router-dom@^6 \
  @tanstack/react-query@^5 \
  zustand@^4 \
  axios@^1 \
  react-hook-form@^7 \
  @hookform/resolvers@^3 \
  zod@^3 \
  framer-motion@^11 \
  clsx@^2 \
  tailwind-merge@^2

npm install --save-dev \
  tailwindcss@^3 \
  postcss@^8 \
  autoprefixer@^10 \
  @types/node@^20 \
  vitest@^1 \
  @testing-library/react@^14 \
  @testing-library/jest-dom@^6 \
  @testing-library/user-event@^14 \
  jsdom@^24
```

- [ ] **Step 3: Initialize Tailwind**

```bash
npx tailwindcss init -p
```

- [ ] **Step 4: Replace `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: '#141414',
        'surface-variant': '#353534',
        primary: '#05ace5',
        secondary: '#547c93',
        tertiary: '#e38d22',
        muted: '#888888',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Update `src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background text-white font-sans;
    font-size: 16px;
  }

  * {
    @apply antialiased;
  }
}

/* Film grain texture overlay */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  opacity: 0.04;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Update `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 7: Update `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 8: Add Vitest config to `vite.config.ts`**

Replace `vite.config.ts` with:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 9: Create test setup file**

```bash
mkdir -p src/test
```

Create `frontend/src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected: `http://localhost:5173/` — Vite default React page loads.

- [ ] **Step 11: Commit**

```bash
cd /var/www/html/MidFlix
git add frontend/
git commit -m "feat: React 18 + Vite + TypeScript + Tailwind scaffold with MidFlix design tokens"
```

---

## Task 8: Shadcn/ui Setup

**Files:**
- Modify: `frontend/` (Shadcn initialisation + Button, Input, Label components)

- [ ] **Step 1: Initialise Shadcn/ui**

```bash
cd frontend
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**

- [ ] **Step 2: Override Shadcn CSS variables in `src/index.css`**

After the Shadcn `@layer base` block, add:

```css
@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 98%;
    --card: 0 0% 8%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 8%;
    --popover-foreground: 0 0% 98%;
    --primary: 197 96% 46%;
    --primary-foreground: 0 0% 100%;
    --secondary: 207 27% 45%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 21%;
    --muted-foreground: 0 0% 53%;
    --accent: 0 0% 21%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 21%;
    --input: 0 0% 21%;
    --ring: 197 96% 46%;
    --radius: 0.5rem;
  }
}
```

- [ ] **Step 3: Install required Shadcn components**

```bash
npx shadcn@latest add button input label form card badge
```

- [ ] **Step 4: Verify components exist**

```bash
ls src/components/ui/
```

Expected: `button.tsx  input.tsx  label.tsx  form.tsx  card.tsx  badge.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/components/ src/index.css components.json
git commit -m "feat: Shadcn/ui initialised with MidFlix dark theme tokens"
```

---

## Task 9: TypeScript Types + Axios Client

**Files:**
- Create: `frontend/src/types/user.ts`
- Create: `frontend/src/lib/cn.ts`
- Create: `frontend/src/lib/constants.ts`
- Create: `frontend/src/api/axios.ts`
- Create: `frontend/src/api/auth.ts`

- [ ] **Step 1: Create `src/types/user.ts`**

```typescript
export interface Subscription {
  plan: 'free' | 'basic' | 'standard' | 'premium'
  status: 'trial' | 'active' | 'expired' | 'cancelled'
  trial_ends_at: string | null
  expires_at: string | null
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  role: 'admin' | 'subscriber'
  is_active: boolean
  email_verified_at: string | null
  subscription: Subscription
  created_at: string
}

export interface AuthResponse {
  user: User
  token: string
}
```

- [ ] **Step 2: Create `src/lib/cn.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Create `src/lib/constants.ts`**

```typescript
export const PLANS = {
  free: { label: 'Free', price: 0 },
  basic: { label: 'Basic', price: 199 },
  standard: { label: 'Standard', price: 499 },
  premium: { label: 'Premium', price: 799 },
} as const

export const ACTIVE_SUBSCRIPTION_STATUSES = ['trial', 'active'] as const

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
```

- [ ] **Step 4: Create `src/api/axios.ts`**

```typescript
import axios from 'axios'
import { API_BASE_URL } from '@/lib/constants'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

- [ ] **Step 5: Create `src/api/auth.ts`**

```typescript
import { apiClient } from './axios'
import type { AuthResponse, User } from '@/types/user'

export async function register(data: {
  name: string
  email: string
  password: string
  password_confirmation: string
}): Promise<AuthResponse> {
  const response = await apiClient.post<{ data: AuthResponse }>('/auth/register', data)
  return response.data.data
}

export async function login(data: {
  email: string
  password: string
}): Promise<AuthResponse> {
  const response = await apiClient.post<{ data: AuthResponse }>('/auth/login', data)
  return response.data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  const response = await apiClient.get<{ data: User }>('/auth/me')
  return response.data.data
}
```

- [ ] **Step 6: Commit**

```bash
git add src/types/ src/lib/ src/api/
git commit -m "feat: TypeScript types, Axios client with interceptors, auth API functions"
```

---

## Task 10: Zustand Auth Store

**Files:**
- Create: `frontend/src/stores/authStore.ts`
- Create: `frontend/src/stores/uiStore.ts`

- [ ] **Step 1: Create `src/stores/authStore.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'
import { ACTIVE_SUBSCRIPTION_STATUSES } from '@/lib/constants'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: User) => void
  isAdmin: () => boolean
  hasActiveSubscription: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('auth_token', token)
        set({ user, token, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('auth_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (user) => set({ user }),

      isAdmin: () => get().user?.role === 'admin',

      hasActiveSubscription: () => {
        const status = get().user?.subscription?.status
        return ACTIVE_SUBSCRIPTION_STATUSES.includes(status as 'trial' | 'active')
      },
    }),
    {
      name: 'midflix-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
```

- [ ] **Step 2: Create `src/stores/uiStore.ts`**

```typescript
import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIState {
  toasts: Toast[]
  sidebarOpen: boolean
  addToast: (message: string, type: Toast['type']) => void
  removeToast: (id: string) => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  sidebarOpen: false,

  addToast: (message, type) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 4000)
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/
git commit -m "feat: Zustand auth store (persisted) and UI store for toasts"
```

---

## Task 11: React Router + Protected Routes

**Files:**
- Create: `frontend/src/router/ProtectedRoute.tsx`
- Create: `frontend/src/router/GuestRoute.tsx`
- Create: `frontend/src/router/index.tsx`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `src/router/ProtectedRoute.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  role: 'subscriber' | 'admin'
}

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, hasActiveSubscription } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role === 'admin' && !isAdmin()) {
    return <Navigate to="/" replace />
  }

  if (role === 'subscriber' && !isAdmin() && !hasActiveSubscription()) {
    return <Navigate to="/subscription" replace />
  }

  return <Outlet />
}
```

- [ ] **Step 2: Create `src/router/GuestRoute.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function GuestRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
```

- [ ] **Step 3: Create `src/router/index.tsx`**

```tsx
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { GuestRoute } from './GuestRoute'
import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'

// Placeholder pages — replaced in later phases
const HomePage = () => <div className="p-8 text-white">Home — Phase 4</div>
const BrowsePage = () => <div className="p-8 text-white">Browse — Phase 6</div>
const SubscriptionPage = () => <div className="p-8 text-white">Subscription — Phase 7</div>
const AdminDashboard = () => <div className="p-8 text-white">Admin — Phase 2</div>

export const router = createBrowserRouter([
  // Guest-only routes
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },

  // Subscriber routes
  {
    element: <ProtectedRoute role="subscriber" />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/browse', element: <BrowsePage /> },
        ],
      },
    ],
  },

  // Auth-only (subscription page — no active sub needed)
  {
    path: '/subscription',
    element: <SubscriptionPage />,
  },

  // Admin routes
  {
    element: <ProtectedRoute role="admin" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminDashboard /> },
        ],
      },
    ],
  },
])
```

- [ ] **Step 4: Update `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from '@/router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
```

- [ ] **Step 5: Clear `src/App.tsx`** (router handles everything now)

```tsx
export function App() {
  return null
}
```

- [ ] **Step 6: Commit**

```bash
git add src/router/ src/main.tsx src/App.tsx
git commit -m "feat: React Router v6 with role-based ProtectedRoute and GuestRoute guards"
```

---

## Task 12: Layouts — AuthLayout, MainLayout Shell, AdminLayout Shell

**Files:**
- Create: `frontend/src/layouts/AuthLayout.tsx`
- Create: `frontend/src/layouts/MainLayout.tsx`
- Create: `frontend/src/layouts/AdminLayout.tsx`

- [ ] **Step 1: Create `src/layouts/AuthLayout.tsx`**

```tsx
import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Radial gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(5,172,229,0.06) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/layouts/MainLayout.tsx`** (shell — nav added in Phase 4)

```tsx
import { Outlet } from 'react-router-dom'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Global nav — implemented in Phase 4 */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface/60 backdrop-blur-[30px]">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
          <span className="font-display text-2xl tracking-widest text-primary">MIDFLIX</span>
        </div>
      </nav>
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/layouts/AdminLayout.tsx`** (shell — sidebar added in Phase 2)

```tsx
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'

export function AdminLayout() {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar shell */}
      <aside className="w-64 bg-surface border-r border-surface-variant flex flex-col">
        <div className="p-6">
          <span className="font-display text-xl tracking-widest text-primary">MIDFLIX</span>
          <p className="text-xs text-muted mt-1 uppercase tracking-widest">Admin</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <Link
            to="/admin"
            className="block px-3 py-2 rounded-card text-sm text-white hover:bg-surface-variant transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/content"
            className="block px-3 py-2 rounded-card text-sm text-white hover:bg-surface-variant transition-colors"
          >
            Content
          </Link>
          <Link
            to="/admin/users"
            className="block px-3 py-2 rounded-card text-sm text-white hover:bg-surface-variant transition-colors"
          >
            Users
          </Link>
        </nav>
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full text-muted hover:text-white text-sm"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/layouts/
git commit -m "feat: AuthLayout, MainLayout, AdminLayout shells with MidFlix design tokens"
```

---

## Task 13: Login + Register Pages

**Files:**
- Create: `frontend/src/pages/auth/LoginPage.tsx`
- Create: `frontend/src/pages/auth/RegisterPage.tsx`

- [ ] **Step 1: Create `src/pages/auth/LoginPage.tsx`**

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAdmin = useAuthStore((s) => s.isAdmin)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      navigate(isAdmin() ? '/admin' : '/')
    },
  })

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-5xl tracking-[0.2em] text-white uppercase">
          MidFlix
        </h1>
        <p className="text-sm text-muted">Sign in to continue watching</p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            className="bg-surface-variant/40 border-0 border-b border-surface-variant rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            className="bg-surface-variant/40 border-0 border-b border-surface-variant rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-400 text-center">
            Invalid email or password
          </p>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold tracking-[0.15em] uppercase text-sm h-11 transition-all hover:scale-[1.02]"
        >
          {mutation.isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
        <Link to="#" className="text-xs text-muted hover:text-white transition-colors">
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/pages/auth/RegisterPage.tsx`**

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { register as registerUser } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      navigate('/subscription')
    },
  })

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-5xl tracking-[0.2em] text-white uppercase">
          MidFlix
        </h1>
        <p className="text-sm text-muted">Create your account</p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Jane Doe"
            {...register('name')}
            className="bg-surface-variant/40 border-0 border-b border-surface-variant rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            className="bg-surface-variant/40 border-0 border-b border-surface-variant rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            {...register('password')}
            className="bg-surface-variant/40 border-0 border-b border-surface-variant rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password_confirmation" className="text-xs uppercase tracking-widest text-muted">
            Confirm Password
          </Label>
          <Input
            id="password_confirmation"
            type="password"
            placeholder="Repeat password"
            {...register('password_confirmation')}
            className="bg-surface-variant/40 border-0 border-b border-surface-variant rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
          {errors.password_confirmation && (
            <p className="text-xs text-red-400">{errors.password_confirmation.message}</p>
          )}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-400 text-center">
            Registration failed. Please try again.
          </p>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold tracking-[0.15em] uppercase text-sm h-11 transition-all hover:scale-[1.02]"
        >
          {mutation.isPending ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Verify app compiles**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Visit `http://localhost:5173/login` — verify the login form renders with MidFlix styling.
Visit `http://localhost:5173/register` — verify the register form renders.
Visit `http://localhost:5173/` — verify redirect to `/login` (not authenticated).

- [ ] **Step 5: Commit**

```bash
git add src/pages/
git commit -m "feat: Login and Register pages with Zod validation and MidFlix cinematic design"
```

---

## Task 14: Email Verification + Password Reset (Stubbed)

**Files:**
- Create: `backend/app/Http/Requests/Auth/ForgotPasswordRequest.php`
- Create: `backend/app/Http/Requests/Auth/ResetPasswordRequest.php`
- Modify: `backend/app/Http/Controllers/Api/V1/AuthController.php`
- Modify: `backend/app/Services/AuthService.php`
- Modify: `backend/routes/api.php`

> Email sending uses Laravel's `log` driver in local dev — no SMTP setup required. Real mail config is Phase 8.

- [ ] **Step 1: Set mail driver to `log` in `.env`**

```env
MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@midflix.com
MAIL_FROM_NAME=MidFlix
```

- [ ] **Step 2: Create `ForgotPasswordRequest`**

Create `backend/app/Http/Requests/Auth/ForgotPasswordRequest.php`:

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
```

- [ ] **Step 3: Create `ResetPasswordRequest`**

Create `backend/app/Http/Requests/Auth/ResetPasswordRequest.php`:

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
```

- [ ] **Step 4: Add `forgotPassword` and `resetPassword` to `AuthService`**

Append these methods to `backend/app/Services/AuthService.php` inside the class:

```php
/**
 * Send password reset link to email.
 */
public function forgotPassword(string $email): void
{
    $status = \Illuminate\Support\Facades\Password::sendResetLink(['email' => $email]);

    if ($status !== \Illuminate\Support\Facades\Password::RESET_LINK_SENT) {
        // Silently ignore unknown emails — prevents user enumeration
        \Illuminate\Support\Facades\Log::info("Password reset attempted for unknown email: {$email}");
    }
}

/**
 * Reset user password and invalidate all tokens.
 *
 * @throws \Illuminate\Validation\ValidationException
 */
public function resetPassword(array $data): void
{
    $status = \Illuminate\Support\Facades\Password::reset(
        $data,
        function (User $user, string $password) {
            $user->forceFill(['password' => $password])->save();
            $user->tokens()->delete();
        }
    );

    if ($status !== \Illuminate\Support\Facades\Password::PASSWORD_RESET) {
        throw \Illuminate\Validation\ValidationException::withMessages([
            'token' => ['This password reset token is invalid or expired.'],
        ]);
    }
}
```

- [ ] **Step 5: Add controller methods to `AuthController`**

Append to `backend/app/Http/Controllers/Api/V1/AuthController.php` inside the class (add the imports at the top: `use App\Http\Requests\Auth\ForgotPasswordRequest;` and `use App\Http\Requests\Auth\ResetPasswordRequest;`):

```php
public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
{
    $this->authService->forgotPassword($request->email);

    return response()->json([
        'success' => true,
        'data' => null,
        'message' => 'If that email exists, a reset link has been sent',
    ]);
}

public function resetPassword(ResetPasswordRequest $request): JsonResponse
{
    $this->authService->resetPassword($request->validated());

    return response()->json([
        'success' => true,
        'data' => null,
        'message' => 'Password reset successfully. Please log in.',
    ]);
}
```

- [ ] **Step 6: Add routes to `routes/api.php`**

Inside the `auth` prefix group (before the `auth:sanctum` middleware group), add:

```php
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
```

- [ ] **Step 7: Configure password reset to use MongoDB**

In `backend/config/auth.php`, confirm the `passwords` section uses the `users` provider:

```php
'passwords' => [
    'users' => [
        'provider' => 'users',
        'table' => 'password_reset_tokens',
        'expire' => 60,
        'throttle' => 60,
    ],
],
```

- [ ] **Step 8: Run all auth tests to verify nothing broke**

```bash
./vendor/bin/pest tests/Feature/Auth/
```

Expected: All 11 tests pass.

- [ ] **Step 9: Commit**

```bash
git add app/Http/Requests/Auth/ app/Http/Controllers/ app/Services/ routes/api.php
git commit -m "feat: forgot password + reset password endpoints (log mailer for local dev)"
```

---

## Task 15: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend:
    name: Laravel Tests
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mongodb, bcmath, pdo
          coverage: none

      - name: Install dependencies
        working-directory: backend
        run: composer install --no-interaction --prefer-dist

      - name: Copy .env
        working-directory: backend
        run: cp .env.example .env && php artisan key:generate

      - name: Configure test env
        working-directory: backend
        run: |
          echo "DB_CONNECTION=mongodb" >> .env
          echo "MONGODB_URI=mongodb://localhost:27017" >> .env
          echo "MONGODB_DATABASE=midflix_test" >> .env
          echo "QUEUE_CONNECTION=sync" >> .env
          echo "CACHE_STORE=array" >> .env

      - name: Run Pest tests
        working-directory: backend
        run: ./vendor/bin/pest --ci

  frontend:
    name: React Build + Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: TypeScript check
        working-directory: frontend
        run: npx tsc --noEmit

      - name: Run Vitest
        working-directory: frontend
        run: npm test -- --run

      - name: Build
        working-directory: frontend
        run: npm run build
```

- [ ] **Step 2: Update `backend/.env.example`** — ensure CI can use it

Add these lines to `.env.example`:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=midflix
```

- [ ] **Step 3: Commit and push to trigger CI**

```bash
git add .github/ backend/.env.example
git commit -m "feat: GitHub Actions CI for Laravel (Pest) and React (Vitest + build)"
git push origin main
```

- [ ] **Step 4: Verify CI passes**

Check the Actions tab in GitHub. Expected: both `Laravel Tests` and `React Build + Tests` jobs pass green.

---

## Phase 1 Complete ✓

At this point the following are working:
- Docker Compose: app, nginx, MongoDB, Redis, Horizon all running
- Laravel 12 API: register, login, logout, me endpoints — all Pest tests passing
- Spatie roles seeded: `admin` + `subscriber`, default admin user created
- React 18 SPA: routing, auth store, login/register pages fully functional
- Protected routes enforce subscriber and admin access
- GitHub Actions CI green on push

**Next:** Begin Phase 2 — Content Admin (plan: `docs/superpowers/plans/2026-03-27-phase-2-content-admin.md`)
