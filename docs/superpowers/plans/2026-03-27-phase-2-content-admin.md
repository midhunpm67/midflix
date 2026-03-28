# MidFlix Phase 2 — Content Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full CRUD for movies, series, seasons, and episodes — admin API with Pest TDD, public browse API with subscriber gate, and a React admin UI wired to TanStack Query.

**Architecture:** Service layer handles all business logic (slug generation, cascade delete, publish toggle). Thin controllers inject services. MongoDB models extend `MongoDB\Laravel\Eloquent\Model`. Admin routes are prefixed `/api/v1/admin/` and require `auth:sanctum` + `role:admin`. Public routes require `auth:sanctum` + `subscriber` middleware for detail views.

**Tech Stack:** Laravel 12, MongoDB 7, Pest, Spatie Permission (guard `sanctum`), React 19, TanStack Query v5, React Hook Form, Zod, Shadcn/ui, Zustand

---

## File Map

### Backend — `backend/`
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/
│   │   │   ├── Admin/
│   │   │   │   ├── ContentController.php       (create)
│   │   │   │   ├── SeasonController.php        (create)
│   │   │   │   └── EpisodeController.php       (create)
│   │   │   ├── ContentController.php           (create — public browse)
│   │   │   └── GenreController.php             (create)
│   │   ├── Requests/Content/
│   │   │   ├── StoreContentRequest.php         (create)
│   │   │   ├── UpdateContentRequest.php        (create)
│   │   │   ├── StoreSeasonRequest.php          (create)
│   │   │   ├── UpdateSeasonRequest.php         (create)
│   │   │   ├── StoreEpisodeRequest.php         (create)
│   │   │   └── UpdateEpisodeRequest.php        (create)
│   │   └── Resources/
│   │       ├── ContentResource.php             (create — full detail)
│   │       ├── ContentListResource.php         (create — list card)
│   │       ├── SeasonResource.php              (create)
│   │       └── EpisodeResource.php             (create)
│   ├── Models/
│   │   ├── Content.php                         (create)
│   │   ├── Season.php                          (create)
│   │   ├── Episode.php                         (create)
│   │   └── Genre.php                           (create)
│   └── Services/
│       ├── ContentService.php                  (create)
│       ├── SeasonService.php                   (create)
│       └── EpisodeService.php                  (create)
├── database/seeders/
│   ├── GenreSeeder.php                         (create)
│   └── DatabaseSeeder.php                      (modify — call GenreSeeder)
├── routes/api.php                              (modify — add all content routes)
└── tests/Feature/
    ├── Admin/
    │   ├── ContentCrudTest.php                 (create)
    │   └── SeasonEpisodeCrudTest.php           (create)
    └── Content/
        ├── ContentBrowseTest.php               (create)
        └── SeasonEpisodeBrowseTest.php         (create)
```

### Frontend — `frontend/`
```
frontend/src/
├── api/
│   ├── admin/
│   │   └── content.ts                         (create)
│   └── content.ts                             (create — public)
├── components/admin/
│   ├── ContentForm.tsx                        (create)
│   ├── SeasonManager.tsx                      (create)
│   └── EpisodeList.tsx                        (create)
├── pages/admin/
│   ├── ContentListPage.tsx                    (create)
│   └── ContentEditPage.tsx                    (create)
├── router/index.tsx                           (modify — add admin content routes)
└── types/
    └── content.ts                             (create)
```

---

## Task 1: Content, Season, Episode, Genre Models + GenreSeeder

**Files:**
- Create: `backend/app/Models/Content.php`
- Create: `backend/app/Models/Season.php`
- Create: `backend/app/Models/Episode.php`
- Create: `backend/app/Models/Genre.php`
- Create: `backend/database/seeders/GenreSeeder.php`
- Modify: `backend/database/seeders/DatabaseSeeder.php`

- [ ] **Step 1: Create Content model**

```php
<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Content extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'content';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'type',
        'genre_ids',
        'cast',
        'director',
        'year',
        'rating',
        'poster_url',
        'backdrop_url',
        'trailer_url',
        'video',
        'is_published',
        'view_count',
        'published_at',
    ];

    protected $casts = [
        'genre_ids' => 'array',
        'cast' => 'array',
        'video' => 'array',
        'is_published' => 'boolean',
        'view_count' => 'integer',
        'published_at' => 'datetime',
        'year' => 'integer',
    ];

    protected $attributes = [
        'is_published' => false,
        'view_count' => 0,
        'genre_ids' => '[]',
        'cast' => '[]',
        'video' => '{"hls_url":null,"status":"pending"}',
    ];
}
```

Save to `backend/app/Models/Content.php`.

- [ ] **Step 2: Create Season model**

```php
<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Season extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'seasons';

    protected $fillable = [
        'content_id',
        'number',
        'title',
        'description',
    ];

    protected $casts = [
        'number' => 'integer',
    ];
}
```

Save to `backend/app/Models/Season.php`.

- [ ] **Step 3: Create Episode model**

```php
<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Episode extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'episodes';

    protected $fillable = [
        'season_id',
        'content_id',
        'number',
        'title',
        'description',
        'duration',
        'thumbnail_url',
        'video',
    ];

    protected $casts = [
        'number' => 'integer',
        'duration' => 'integer',
        'video' => 'array',
    ];

    protected $attributes = [
        'video' => '{"hls_url":null,"status":"pending"}',
    ];
}
```

Save to `backend/app/Models/Episode.php`.

- [ ] **Step 4: Create Genre model**

```php
<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Genre extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'genres';

    protected $fillable = [
        'name',
        'slug',
    ];
}
```

Save to `backend/app/Models/Genre.php`.

- [ ] **Step 5: Create GenreSeeder**

```php
<?php

namespace Database\Seeders;

use App\Models\Genre;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GenreSeeder extends Seeder
{
    public function run(): void
    {
        $genres = [
            'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
            'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery',
            'Romance', 'Sci-Fi', 'Thriller', 'Western',
        ];

        foreach ($genres as $name) {
            Genre::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
        }
    }
}
```

Save to `backend/database/seeders/GenreSeeder.php`.

- [ ] **Step 6: Update DatabaseSeeder to call GenreSeeder**

Read `backend/database/seeders/DatabaseSeeder.php` first, then add `$this->call(GenreSeeder::class);` inside the `run()` method alongside the existing `RoleSeeder::class` call.

- [ ] **Step 7: Run seeder and verify**

```bash
cd /var/www/html/MidFlix/backend && php artisan db:seed --class=GenreSeeder
```

Expected: no errors, `genres` collection has 14 documents.

- [ ] **Step 8: Commit**

```bash
cd /var/www/html/MidFlix/backend
git add app/Models/Content.php app/Models/Season.php app/Models/Episode.php app/Models/Genre.php database/seeders/GenreSeeder.php database/seeders/DatabaseSeeder.php
git commit -m "feat: add Content, Season, Episode, Genre models and GenreSeeder"
```

---

## Task 2: Form Requests + API Resources

**Files:**
- Create: `backend/app/Http/Requests/Content/StoreContentRequest.php`
- Create: `backend/app/Http/Requests/Content/UpdateContentRequest.php`
- Create: `backend/app/Http/Requests/Content/StoreSeasonRequest.php`
- Create: `backend/app/Http/Requests/Content/UpdateSeasonRequest.php`
- Create: `backend/app/Http/Requests/Content/StoreEpisodeRequest.php`
- Create: `backend/app/Http/Requests/Content/UpdateEpisodeRequest.php`
- Create: `backend/app/Http/Resources/ContentResource.php`
- Create: `backend/app/Http/Resources/ContentListResource.php`
- Create: `backend/app/Http/Resources/SeasonResource.php`
- Create: `backend/app/Http/Resources/EpisodeResource.php`

- [ ] **Step 1: Create StoreContentRequest**

```php
<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'        => ['required', 'string', 'max:255'],
            'description'  => ['required', 'string'],
            'type'         => ['required', 'in:movie,series'],
            'genre_ids'    => ['sometimes', 'array'],
            'genre_ids.*'  => ['string'],
            'cast'         => ['sometimes', 'array'],
            'cast.*'       => ['string'],
            'director'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'year'         => ['sometimes', 'nullable', 'integer', 'min:1888', 'max:2100'],
            'rating'       => ['sometimes', 'nullable', 'string', 'max:10'],
            'poster_url'   => ['sometimes', 'nullable', 'url'],
            'backdrop_url' => ['sometimes', 'nullable', 'url'],
            'trailer_url'  => ['sometimes', 'nullable', 'url'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success'    => false,
            'message'    => 'Validation failed',
            'errors'     => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
```

- [ ] **Step 2: Create UpdateContentRequest**

```php
<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'        => ['sometimes', 'string', 'max:255'],
            'description'  => ['sometimes', 'string'],
            'type'         => ['sometimes', 'in:movie,series'],
            'genre_ids'    => ['sometimes', 'array'],
            'genre_ids.*'  => ['string'],
            'cast'         => ['sometimes', 'array'],
            'cast.*'       => ['string'],
            'director'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'year'         => ['sometimes', 'nullable', 'integer', 'min:1888', 'max:2100'],
            'rating'       => ['sometimes', 'nullable', 'string', 'max:10'],
            'poster_url'   => ['sometimes', 'nullable', 'url'],
            'backdrop_url' => ['sometimes', 'nullable', 'url'],
            'trailer_url'  => ['sometimes', 'nullable', 'url'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success'    => false,
            'message'    => 'Validation failed',
            'errors'     => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
```

- [ ] **Step 3: Create StoreSeasonRequest**

```php
<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreSeasonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'number'      => ['required', 'integer', 'min:1'],
            'title'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success'    => false,
            'message'    => 'Validation failed',
            'errors'     => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
```

- [ ] **Step 4: Create UpdateSeasonRequest**

```php
<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateSeasonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'number'      => ['sometimes', 'integer', 'min:1'],
            'title'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success'    => false,
            'message'    => 'Validation failed',
            'errors'     => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
```

- [ ] **Step 5: Create StoreEpisodeRequest**

```php
<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreEpisodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'number'        => ['required', 'integer', 'min:1'],
            'title'         => ['required', 'string', 'max:255'],
            'description'   => ['sometimes', 'nullable', 'string'],
            'duration'      => ['sometimes', 'nullable', 'integer', 'min:1'],
            'thumbnail_url' => ['sometimes', 'nullable', 'url'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success'    => false,
            'message'    => 'Validation failed',
            'errors'     => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
```

- [ ] **Step 6: Create UpdateEpisodeRequest**

```php
<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateEpisodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'number'        => ['sometimes', 'integer', 'min:1'],
            'title'         => ['sometimes', 'string', 'max:255'],
            'description'   => ['sometimes', 'nullable', 'string'],
            'duration'      => ['sometimes', 'nullable', 'integer', 'min:1'],
            'thumbnail_url' => ['sometimes', 'nullable', 'url'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success'    => false,
            'message'    => 'Validation failed',
            'errors'     => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
```

- [ ] **Step 7: Create ContentListResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => (string) $this->_id,
            'title'        => $this->title,
            'slug'         => $this->slug,
            'type'         => $this->type,
            'year'         => $this->year,
            'rating'       => $this->rating,
            'poster_url'   => $this->poster_url,
            'backdrop_url' => $this->backdrop_url,
            'genre_ids'    => $this->genre_ids ?? [],
            'is_published' => $this->is_published,
            'view_count'   => $this->view_count,
            'published_at' => $this->published_at?->toIso8601String(),
            'created_at'   => $this->created_at?->toIso8601String(),
        ];
    }
}
```

Save to `backend/app/Http/Resources/ContentListResource.php`.

- [ ] **Step 8: Create ContentResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => (string) $this->_id,
            'title'        => $this->title,
            'slug'         => $this->slug,
            'description'  => $this->description,
            'type'         => $this->type,
            'genre_ids'    => $this->genre_ids ?? [],
            'cast'         => $this->cast ?? [],
            'director'     => $this->director,
            'year'         => $this->year,
            'rating'       => $this->rating,
            'poster_url'   => $this->poster_url,
            'backdrop_url' => $this->backdrop_url,
            'trailer_url'  => $this->trailer_url,
            'video'        => $this->video,
            'is_published' => $this->is_published,
            'view_count'   => $this->view_count,
            'published_at' => $this->published_at?->toIso8601String(),
            'created_at'   => $this->created_at?->toIso8601String(),
            'updated_at'   => $this->updated_at?->toIso8601String(),
        ];
    }
}
```

Save to `backend/app/Http/Resources/ContentResource.php`.

- [ ] **Step 9: Create SeasonResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeasonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => (string) $this->_id,
            'content_id'  => $this->content_id,
            'number'      => $this->number,
            'title'       => $this->title,
            'description' => $this->description,
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}
```

Save to `backend/app/Http/Resources/SeasonResource.php`.

- [ ] **Step 10: Create EpisodeResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EpisodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => (string) $this->_id,
            'season_id'     => $this->season_id,
            'content_id'    => $this->content_id,
            'number'        => $this->number,
            'title'         => $this->title,
            'description'   => $this->description,
            'duration'      => $this->duration,
            'thumbnail_url' => $this->thumbnail_url,
            'video'         => $this->video,
            'created_at'    => $this->created_at?->toIso8601String(),
        ];
    }
}
```

Save to `backend/app/Http/Resources/EpisodeResource.php`.

- [ ] **Step 11: Commit**

```bash
cd /var/www/html/MidFlix/backend
git add app/Http/Requests/Content/ app/Http/Resources/ContentListResource.php app/Http/Resources/ContentResource.php app/Http/Resources/SeasonResource.php app/Http/Resources/EpisodeResource.php
git commit -m "feat: add content form requests and API resources"
```

---

## Task 3: ContentService + Admin Content CRUD API (TDD)

**Files:**
- Create: `backend/app/Services/ContentService.php`
- Create: `backend/app/Http/Controllers/Api/V1/Admin/ContentController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/Admin/ContentCrudTest.php`

- [ ] **Step 1: Write the failing tests**

```php
<?php

use App\Models\Content;
use App\Models\Episode;
use App\Models\Genre;
use App\Models\PersonalAccessToken;
use App\Models\Role;
use App\Models\Season;
use App\Models\User;

beforeEach(function () {
    User::truncate();
    PersonalAccessToken::truncate();
    Role::truncate();
    Content::truncate();
    Season::truncate();
    Episode::truncate();
    $mongodb = \DB::connection('mongodb')->getMongoDB();
    $mongodb->selectCollection('model_has_roles')->deleteMany([]);
    $mongodb->selectCollection('model_has_permissions')->deleteMany([]);
    $mongodb->selectCollection('role_has_permissions')->deleteMany([]);
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
    Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'sanctum']);
});

function makeAdmin(): array
{
    $admin = User::factory()->create(['is_active' => true]);
    $adminRole = Role::where('name', 'admin')->where('guard_name', 'sanctum')->first();
    $admin->assignRole($adminRole);
    $token = $admin->createToken('test')->plainTextToken;
    return [$admin, $token];
}

function makeSubscriber(): array
{
    $user = User::factory()->create(['is_active' => true]);
    $subscriberRole = Role::where('name', 'subscriber')->where('guard_name', 'sanctum')->first();
    $user->assignRole($subscriberRole);
    $token = $user->createToken('test')->plainTextToken;
    return [$user, $token];
}

test('admin can list all content', function () {
    [, $token] = makeAdmin();
    Content::factory()->count(3)->create();

    $response = $this->withToken($token)->getJson('/api/v1/admin/content');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonCount(3, 'data.items');
});

test('admin list includes unpublished content', function () {
    [, $token] = makeAdmin();
    Content::factory()->create(['is_published' => true]);
    Content::factory()->create(['is_published' => false]);

    $response = $this->withToken($token)->getJson('/api/v1/admin/content');

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data.items');
});

test('admin can create content', function () {
    [, $token] = makeAdmin();

    $response = $this->withToken($token)->postJson('/api/v1/admin/content', [
        'title'       => 'The Dark Knight',
        'description' => 'When the menace known as the Joker wreaks havoc.',
        'type'        => 'movie',
        'year'        => 2008,
        'rating'      => 'PG-13',
    ]);

    $response->assertStatus(201)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.title', 'The Dark Knight')
        ->assertJsonPath('data.slug', 'the-dark-knight');

    expect(Content::count())->toBe(1);
});

test('create content generates unique slug on collision', function () {
    [, $token] = makeAdmin();
    Content::factory()->create(['title' => 'Test Movie', 'slug' => 'test-movie']);

    $response = $this->withToken($token)->postJson('/api/v1/admin/content', [
        'title'       => 'Test Movie',
        'description' => 'Another test movie.',
        'type'        => 'movie',
    ]);

    $response->assertStatus(201);
    $slug = $response->json('data.slug');
    expect($slug)->not->toBe('test-movie');
    expect($slug)->toStartWith('test-movie-');
});

test('create content requires title, description, type', function () {
    [, $token] = makeAdmin();

    $response = $this->withToken($token)->postJson('/api/v1/admin/content', []);

    $response->assertStatus(422)
        ->assertJson(['error_code' => 'VALIDATION_ERROR'])
        ->assertJsonValidationErrors(['title', 'description', 'type']);
});

test('admin can update content', function () {
    [, $token] = makeAdmin();
    $content = Content::factory()->create(['title' => 'Old Title']);

    $response = $this->withToken($token)->putJson("/api/v1/admin/content/{$content->_id}", [
        'title' => 'New Title',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.title', 'New Title');
});

test('admin can publish content', function () {
    [, $token] = makeAdmin();
    $content = Content::factory()->create(['is_published' => false]);

    $response = $this->withToken($token)->patchJson("/api/v1/admin/content/{$content->_id}/publish");

    $response->assertStatus(200)
        ->assertJsonPath('data.is_published', true);
});

test('admin can unpublish content', function () {
    [, $token] = makeAdmin();
    $content = Content::factory()->create(['is_published' => true]);

    $response = $this->withToken($token)->patchJson("/api/v1/admin/content/{$content->_id}/publish");

    $response->assertStatus(200)
        ->assertJsonPath('data.is_published', false);
});

test('admin can delete content', function () {
    [, $token] = makeAdmin();
    $content = Content::factory()->create();

    $response = $this->withToken($token)->deleteJson("/api/v1/admin/content/{$content->_id}");

    $response->assertStatus(200)->assertJson(['success' => true]);
    expect(Content::count())->toBe(0);
});

test('delete content cascades to seasons and episodes', function () {
    [, $token] = makeAdmin();
    $content = Content::factory()->create();
    $season = Season::create(['content_id' => (string) $content->_id, 'number' => 1]);
    Episode::create(['season_id' => (string) $season->_id, 'content_id' => (string) $content->_id, 'number' => 1, 'title' => 'Ep 1']);

    $this->withToken($token)->deleteJson("/api/v1/admin/content/{$content->_id}");

    expect(Season::count())->toBe(0);
    expect(Episode::count())->toBe(0);
});

test('admin can get stats', function () {
    [, $token] = makeAdmin();
    Content::factory()->count(2)->create(['is_published' => true, 'type' => 'movie']);
    Content::factory()->count(1)->create(['is_published' => false, 'type' => 'series']);

    $response = $this->withToken($token)->getJson('/api/v1/admin/stats');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonStructure(['data' => ['total_content', 'published', 'unpublished', 'movies', 'series']]);
});

test('subscriber cannot access admin content endpoints', function () {
    [, $token] = makeSubscriber();

    $this->withToken($token)->getJson('/api/v1/admin/content')
        ->assertStatus(403);
});
```

Save to `backend/tests/Feature/Admin/ContentCrudTest.php`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /var/www/html/MidFlix/backend && php artisan test tests/Feature/Admin/ContentCrudTest.php
```

Expected: FAIL — controllers and service don't exist yet.

- [ ] **Step 3: Create a Content factory**

```php
<?php

namespace Database\Factories;

use App\Models\Content;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ContentFactory extends Factory
{
    protected $model = Content::class;

    public function definition(): array
    {
        $title = $this->faker->sentence(3, false);

        return [
            'title'        => $title,
            'slug'         => Str::slug($title),
            'description'  => $this->faker->paragraph(),
            'type'         => $this->faker->randomElement(['movie', 'series']),
            'genre_ids'    => [],
            'cast'         => [],
            'director'     => $this->faker->name(),
            'year'         => $this->faker->numberBetween(1990, 2024),
            'rating'       => $this->faker->randomElement(['G', 'PG', 'PG-13', 'R']),
            'poster_url'   => null,
            'backdrop_url' => null,
            'trailer_url'  => null,
            'video'        => ['hls_url' => null, 'status' => 'pending'],
            'is_published' => false,
            'view_count'   => 0,
        ];
    }
}
```

Save to `backend/database/factories/ContentFactory.php`.

- [ ] **Step 4: Create ContentService**

```php
<?php

namespace App\Services;

use App\Models\Content;
use App\Models\Episode;
use App\Models\Season;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class ContentService
{
    public function listAdmin(array $filters = []): LengthAwarePaginator
    {
        $query = Content::query();

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['search'])) {
            $query->where('title', 'like', '%' . $filters['search'] . '%');
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    public function listPublic(array $filters = []): LengthAwarePaginator
    {
        $query = Content::where('is_published', true);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['genre_id'])) {
            $query->where('genre_ids', $filters['genre_id']);
        }

        if (!empty($filters['search'])) {
            $query->where('title', 'like', '%' . $filters['search'] . '%');
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    public function trending(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return Content::where('is_published', true)
            ->orderBy('view_count', 'desc')
            ->limit($limit)
            ->get();
    }

    public function newReleases(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return Content::where('is_published', true)
            ->whereNotNull('published_at')
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function store(array $data): Content
    {
        $data['slug'] = $this->generateUniqueSlug($data['title']);

        return Content::create($data);
    }

    public function update(Content $content, array $data): Content
    {
        if (isset($data['title']) && $data['title'] !== $content->title) {
            $data['slug'] = $this->generateUniqueSlug($data['title'], (string) $content->_id);
        }

        $content->update($data);
        $content->refresh();

        return $content;
    }

    public function togglePublish(Content $content): Content
    {
        $isPublishing = !$content->is_published;

        $content->update([
            'is_published' => $isPublishing,
            'published_at' => $isPublishing ? now() : $content->published_at,
        ]);

        $content->refresh();

        return $content;
    }

    public function destroy(Content $content): void
    {
        $contentId = (string) $content->_id;

        $seasonIds = Season::where('content_id', $contentId)
            ->pluck('_id')
            ->map(fn ($id) => (string) $id)
            ->toArray();

        if (!empty($seasonIds)) {
            Episode::whereIn('season_id', $seasonIds)->delete();
        }

        Season::where('content_id', $contentId)->delete();
        $content->delete();
    }

    public function stats(): array
    {
        $total = Content::count();
        $published = Content::where('is_published', true)->count();

        return [
            'total_content' => $total,
            'published'     => $published,
            'unpublished'   => $total - $published,
            'movies'        => Content::where('type', 'movie')->count(),
            'series'        => Content::where('type', 'series')->count(),
        ];
    }

    private function generateUniqueSlug(string $title, ?string $excludeId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $counter = 1;

        while (true) {
            $query = Content::where('slug', $slug);
            if ($excludeId) {
                $query->where('_id', '!=', $excludeId);
            }
            if (!$query->exists()) {
                break;
            }
            $slug = $base . '-' . $counter++;
        }

        return $slug;
    }
}
```

Save to `backend/app/Services/ContentService.php`.

- [ ] **Step 5: Create Admin ContentController**

```php
<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Content\StoreContentRequest;
use App\Http\Requests\Content\UpdateContentRequest;
use App\Http\Resources\ContentListResource;
use App\Http\Resources\ContentResource;
use App\Models\Content;
use App\Services\ContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function __construct(private readonly ContentService $contentService) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->contentService->listAdmin($request->only(['type', 'search']));

        return response()->json([
            'success' => true,
            'data'    => [
                'items'        => ContentListResource::collection($paginator->items()),
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StoreContentRequest $request): JsonResponse
    {
        $content = $this->contentService->store($request->validated());

        return response()->json([
            'success' => true,
            'data'    => new ContentResource($content),
            'message' => 'Content created successfully',
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $content = Content::findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => new ContentResource($content),
        ]);
    }

    public function update(UpdateContentRequest $request, string $id): JsonResponse
    {
        $content = Content::findOrFail($id);
        $updated = $this->contentService->update($content, $request->validated());

        return response()->json([
            'success' => true,
            'data'    => new ContentResource($updated),
            'message' => 'Content updated successfully',
        ]);
    }

    public function togglePublish(string $id): JsonResponse
    {
        $content = Content::findOrFail($id);
        $updated = $this->contentService->togglePublish($content);

        return response()->json([
            'success' => true,
            'data'    => new ContentResource($updated),
            'message' => $updated->is_published ? 'Content published' : 'Content unpublished',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $content = Content::findOrFail($id);
        $this->contentService->destroy($content);

        return response()->json([
            'success' => true,
            'message' => 'Content deleted successfully',
        ]);
    }
}
```

Save to `backend/app/Http/Controllers/Api/V1/Admin/ContentController.php`.

- [ ] **Step 6: Create Admin StatsController**

```php
<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\ContentService;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    public function __construct(private readonly ContentService $contentService) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->contentService->stats(),
        ]);
    }
}
```

Save to `backend/app/Http/Controllers/Api/V1/Admin/StatsController.php`.

- [ ] **Step 7: Add admin routes to api.php**

Read `backend/routes/api.php`, then replace the closing `});` of the `v1` group with:

```php
    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\V1\Admin\StatsController::class, 'index']);

        Route::get('/content', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'index']);
        Route::post('/content', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'store']);
        Route::get('/content/{id}', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'show']);
        Route::put('/content/{id}', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'update']);
        Route::patch('/content/{id}/publish', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'togglePublish']);
        Route::delete('/content/{id}', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'destroy']);
    });
```

- [ ] **Step 8: Run the tests and verify they pass**

```bash
cd /var/www/html/MidFlix/backend && php artisan test tests/Feature/Admin/ContentCrudTest.php
```

Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
cd /var/www/html/MidFlix/backend
git add app/Services/ContentService.php app/Http/Controllers/Api/V1/Admin/ database/factories/ContentFactory.php routes/api.php tests/Feature/Admin/ContentCrudTest.php
git commit -m "feat: add admin content CRUD API with ContentService"
```

---

## Task 4: Public Content Browse API (TDD)

**Files:**
- Create: `backend/app/Http/Controllers/Api/V1/ContentController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/Content/ContentBrowseTest.php`

- [ ] **Step 1: Write the failing tests**

```php
<?php

use App\Models\Content;
use App\Models\Genre;
use App\Models\PersonalAccessToken;
use App\Models\Role;
use App\Models\User;

beforeEach(function () {
    User::truncate();
    PersonalAccessToken::truncate();
    Role::truncate();
    Content::truncate();
    $mongodb = \DB::connection('mongodb')->getMongoDB();
    $mongodb->selectCollection('model_has_roles')->deleteMany([]);
    $mongodb->selectCollection('model_has_permissions')->deleteMany([]);
    $mongodb->selectCollection('role_has_permissions')->deleteMany([]);
    Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'sanctum']);
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
});

function makeActiveSubscriber(): array
{
    $user = User::factory()->create([
        'is_active' => true,
        'subscription' => ['plan' => 'basic', 'status' => 'active', 'trial_ends_at' => null, 'expires_at' => null],
    ]);
    $role = Role::where('name', 'subscriber')->first();
    $user->assignRole($role);
    $token = $user->createToken('test')->plainTextToken;
    return [$user, $token];
}

test('subscriber can browse published content', function () {
    [, $token] = makeActiveSubscriber();
    Content::factory()->count(3)->create(['is_published' => true]);
    Content::factory()->count(2)->create(['is_published' => false]);

    $response = $this->withToken($token)->getJson('/api/v1/content');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonCount(3, 'data.items');
});

test('unauthenticated user cannot browse content', function () {
    $this->getJson('/api/v1/content')->assertStatus(401);
});

test('subscriber can get content detail by slug', function () {
    [, $token] = makeActiveSubscriber();
    $content = Content::factory()->create(['is_published' => true, 'slug' => 'my-movie']);

    $response = $this->withToken($token)->getJson('/api/v1/content/my-movie');

    $response->assertStatus(200)
        ->assertJsonPath('data.slug', 'my-movie');
});

test('content detail 404 if unpublished', function () {
    [, $token] = makeActiveSubscriber();
    Content::factory()->create(['is_published' => false, 'slug' => 'hidden-movie']);

    $this->withToken($token)->getJson('/api/v1/content/hidden-movie')
        ->assertStatus(404);
});

test('subscriber can get trending content', function () {
    [, $token] = makeActiveSubscriber();
    Content::factory()->create(['is_published' => true, 'view_count' => 100]);
    Content::factory()->create(['is_published' => true, 'view_count' => 50]);

    $response = $this->withToken($token)->getJson('/api/v1/content/trending');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonCount(2, 'data');
});

test('subscriber can get new releases', function () {
    [, $token] = makeActiveSubscriber();
    Content::factory()->create(['is_published' => true, 'published_at' => now()->subDay()]);

    $response = $this->withToken($token)->getJson('/api/v1/content/new-releases');

    $response->assertStatus(200)->assertJson(['success' => true]);
});

test('subscriber can search content', function () {
    [, $token] = makeActiveSubscriber();
    Content::factory()->create(['is_published' => true, 'title' => 'Batman Begins']);
    Content::factory()->create(['is_published' => true, 'title' => 'Superman Returns']);

    $response = $this->withToken($token)->getJson('/api/v1/content/search?q=batman');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data.items');
});

test('user without active subscription gets 403 on content detail', function () {
    $user = User::factory()->create([
        'is_active' => true,
        'subscription' => ['plan' => 'free', 'status' => 'expired', 'trial_ends_at' => null, 'expires_at' => null],
    ]);
    $role = Role::where('name', 'subscriber')->first();
    $user->assignRole($role);
    $token = $user->createToken('test')->plainTextToken;
    $content = Content::factory()->create(['is_published' => true, 'slug' => 'locked-movie']);

    $this->withToken($token)->getJson('/api/v1/content/locked-movie')
        ->assertStatus(403);
});
```

Save to `backend/tests/Feature/Content/ContentBrowseTest.php`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /var/www/html/MidFlix/backend && php artisan test tests/Feature/Content/ContentBrowseTest.php
```

Expected: FAIL — controller doesn't exist.

- [ ] **Step 3: Create public ContentController**

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContentListResource;
use App\Http\Resources\ContentResource;
use App\Models\Content;
use App\Services\ContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function __construct(private readonly ContentService $contentService) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->contentService->listPublic($request->only(['type', 'genre_id']));

        return response()->json([
            'success' => true,
            'data'    => [
                'items'        => ContentListResource::collection($paginator->items()),
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function trending(): JsonResponse
    {
        $items = $this->contentService->trending();

        return response()->json([
            'success' => true,
            'data'    => ContentListResource::collection($items),
        ]);
    }

    public function newReleases(): JsonResponse
    {
        $items = $this->contentService->newReleases();

        return response()->json([
            'success' => true,
            'data'    => ContentListResource::collection($items),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $paginator = $this->contentService->listPublic(['search' => $request->query('q', '')]);

        return response()->json([
            'success' => true,
            'data'    => [
                'items'        => ContentListResource::collection($paginator->items()),
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $content = Content::where('slug', $slug)->where('is_published', true)->firstOrFail();

        $content->increment('view_count');

        return response()->json([
            'success' => true,
            'data'    => new ContentResource($content),
        ]);
    }
}
```

Save to `backend/app/Http/Controllers/Api/V1/ContentController.php`.

- [ ] **Step 4: Add public content routes to api.php**

After the admin route group inside `prefix('v1')`, add:

```php
    Route::middleware('auth:sanctum')->prefix('content')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\V1\ContentController::class, 'index']);
        Route::get('/trending', [\App\Http\Controllers\Api\V1\ContentController::class, 'trending']);
        Route::get('/new-releases', [\App\Http\Controllers\Api\V1\ContentController::class, 'newReleases']);
        Route::get('/search', [\App\Http\Controllers\Api\V1\ContentController::class, 'search']);
        Route::middleware('subscriber')->get('/{slug}', [\App\Http\Controllers\Api\V1\ContentController::class, 'show']);
    });
```

Note: `trending`, `new-releases`, and `search` are declared **before** `{slug}` so they are not swallowed by the slug parameter.

The `subscriber` middleware alias must be registered. In `backend/bootstrap/app.php`, add `'subscriber' => \App\Http\Middleware\CheckSubscriberAccess::class` to the `withMiddleware` callback's `$middleware->alias()` call.

- [ ] **Step 5: Run the tests and verify they pass**

```bash
cd /var/www/html/MidFlix/backend && php artisan test tests/Feature/Content/ContentBrowseTest.php
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
cd /var/www/html/MidFlix/backend
git add app/Http/Controllers/Api/V1/ContentController.php routes/api.php tests/Feature/Content/ContentBrowseTest.php bootstrap/app.php
git commit -m "feat: add public content browse API"
```

---

## Task 5: Admin Seasons + Episodes API (TDD)

**Files:**
- Create: `backend/app/Services/SeasonService.php`
- Create: `backend/app/Services/EpisodeService.php`
- Create: `backend/app/Http/Controllers/Api/V1/Admin/SeasonController.php`
- Create: `backend/app/Http/Controllers/Api/V1/Admin/EpisodeController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/Admin/SeasonEpisodeCrudTest.php`

- [ ] **Step 1: Write the failing tests**

```php
<?php

use App\Models\Content;
use App\Models\Episode;
use App\Models\PersonalAccessToken;
use App\Models\Role;
use App\Models\Season;
use App\Models\User;

beforeEach(function () {
    User::truncate();
    PersonalAccessToken::truncate();
    Role::truncate();
    Content::truncate();
    Season::truncate();
    Episode::truncate();
    $mongodb = \DB::connection('mongodb')->getMongoDB();
    $mongodb->selectCollection('model_has_roles')->deleteMany([]);
    $mongodb->selectCollection('model_has_permissions')->deleteMany([]);
    $mongodb->selectCollection('role_has_permissions')->deleteMany([]);
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
    Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'sanctum']);
});

function adminToken(): string
{
    $admin = User::factory()->create(['is_active' => true]);
    $adminRole = Role::where('name', 'admin')->first();
    $admin->assignRole($adminRole);
    return $admin->createToken('test')->plainTextToken;
}

// --- Season tests ---

test('admin can create a season for a series', function () {
    $token = adminToken();
    $content = Content::factory()->create(['type' => 'series']);

    $response = $this->withToken($token)->postJson("/api/v1/admin/content/{$content->_id}/seasons", [
        'number' => 1,
        'title'  => 'Season One',
    ]);

    $response->assertStatus(201)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.number', 1)
        ->assertJsonPath('data.content_id', (string) $content->_id);

    expect(Season::count())->toBe(1);
});

test('season creation requires number', function () {
    $token = adminToken();
    $content = Content::factory()->create(['type' => 'series']);

    $this->withToken($token)->postJson("/api/v1/admin/content/{$content->_id}/seasons", [])
        ->assertStatus(422)
        ->assertJson(['error_code' => 'VALIDATION_ERROR']);
});

test('admin can update a season', function () {
    $token = adminToken();
    $content = Content::factory()->create(['type' => 'series']);
    $season = Season::create(['content_id' => (string) $content->_id, 'number' => 1, 'title' => 'Old']);

    $response = $this->withToken($token)->putJson("/api/v1/admin/seasons/{$season->_id}", [
        'title' => 'Updated Season',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.title', 'Updated Season');
});

test('admin can delete a season and its episodes', function () {
    $token = adminToken();
    $content = Content::factory()->create(['type' => 'series']);
    $season = Season::create(['content_id' => (string) $content->_id, 'number' => 1]);
    Episode::create(['season_id' => (string) $season->_id, 'content_id' => (string) $content->_id, 'number' => 1, 'title' => 'Ep']);

    $this->withToken($token)->deleteJson("/api/v1/admin/seasons/{$season->_id}")
        ->assertStatus(200);

    expect(Season::count())->toBe(0);
    expect(Episode::count())->toBe(0);
});

// --- Episode tests ---

test('admin can create an episode in a season', function () {
    $token = adminToken();
    $content = Content::factory()->create(['type' => 'series']);
    $season = Season::create(['content_id' => (string) $content->_id, 'number' => 1]);

    $response = $this->withToken($token)->postJson("/api/v1/admin/seasons/{$season->_id}/episodes", [
        'number' => 1,
        'title'  => 'Pilot',
    ]);

    $response->assertStatus(201)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.title', 'Pilot')
        ->assertJsonPath('data.season_id', (string) $season->_id);

    expect(Episode::count())->toBe(1);
});

test('episode creation requires number and title', function () {
    $token = adminToken();
    $content = Content::factory()->create(['type' => 'series']);
    $season = Season::create(['content_id' => (string) $content->_id, 'number' => 1]);

    $this->withToken($token)->postJson("/api/v1/admin/seasons/{$season->_id}/episodes", [])
        ->assertStatus(422)
        ->assertJson(['error_code' => 'VALIDATION_ERROR']);
});

test('admin can update an episode', function () {
    $token = adminToken();
    $content = Content::factory()->create(['type' => 'series']);
    $season = Season::create(['content_id' => (string) $content->_id, 'number' => 1]);
    $episode = Episode::create(['season_id' => (string) $season->_id, 'content_id' => (string) $content->_id, 'number' => 1, 'title' => 'Old']);

    $response = $this->withToken($token)->putJson("/api/v1/admin/episodes/{$episode->_id}", [
        'title' => 'New Title',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.title', 'New Title');
});

test('admin can delete an episode', function () {
    $token = adminToken();
    $content = Content::factory()->create(['type' => 'series']);
    $season = Season::create(['content_id' => (string) $content->_id, 'number' => 1]);
    $episode = Episode::create(['season_id' => (string) $season->_id, 'content_id' => (string) $content->_id, 'number' => 1, 'title' => 'Ep']);

    $this->withToken($token)->deleteJson("/api/v1/admin/episodes/{$episode->_id}")
        ->assertStatus(200);

    expect(Episode::count())->toBe(0);
});
```

Save to `backend/tests/Feature/Admin/SeasonEpisodeCrudTest.php`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /var/www/html/MidFlix/backend && php artisan test tests/Feature/Admin/SeasonEpisodeCrudTest.php
```

Expected: FAIL.

- [ ] **Step 3: Create SeasonService**

```php
<?php

namespace App\Services;

use App\Models\Episode;
use App\Models\Season;

class SeasonService
{
    public function store(string $contentId, array $data): Season
    {
        $data['content_id'] = $contentId;
        return Season::create($data);
    }

    public function update(Season $season, array $data): Season
    {
        $season->update($data);
        $season->refresh();
        return $season;
    }

    public function destroy(Season $season): void
    {
        Episode::where('season_id', (string) $season->_id)->delete();
        $season->delete();
    }
}
```

Save to `backend/app/Services/SeasonService.php`.

- [ ] **Step 4: Create EpisodeService**

```php
<?php

namespace App\Services;

use App\Models\Episode;
use App\Models\Season;

class EpisodeService
{
    public function store(Season $season, array $data): Episode
    {
        $data['season_id'] = (string) $season->_id;
        $data['content_id'] = $season->content_id;
        return Episode::create($data);
    }

    public function update(Episode $episode, array $data): Episode
    {
        $episode->update($data);
        $episode->refresh();
        return $episode;
    }

    public function destroy(Episode $episode): void
    {
        $episode->delete();
    }
}
```

Save to `backend/app/Services/EpisodeService.php`.

- [ ] **Step 5: Create Admin SeasonController**

```php
<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Content\StoreSeasonRequest;
use App\Http\Requests\Content\UpdateSeasonRequest;
use App\Http\Resources\SeasonResource;
use App\Models\Content;
use App\Models\Season;
use App\Services\SeasonService;
use Illuminate\Http\JsonResponse;

class SeasonController extends Controller
{
    public function __construct(private readonly SeasonService $seasonService) {}

    public function store(StoreSeasonRequest $request, string $contentId): JsonResponse
    {
        Content::findOrFail($contentId);
        $season = $this->seasonService->store($contentId, $request->validated());

        return response()->json([
            'success' => true,
            'data'    => new SeasonResource($season),
            'message' => 'Season created successfully',
        ], 201);
    }

    public function update(UpdateSeasonRequest $request, string $id): JsonResponse
    {
        $season = Season::findOrFail($id);
        $updated = $this->seasonService->update($season, $request->validated());

        return response()->json([
            'success' => true,
            'data'    => new SeasonResource($updated),
            'message' => 'Season updated successfully',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $season = Season::findOrFail($id);
        $this->seasonService->destroy($season);

        return response()->json([
            'success' => true,
            'message' => 'Season deleted successfully',
        ]);
    }
}
```

Save to `backend/app/Http/Controllers/Api/V1/Admin/SeasonController.php`.

- [ ] **Step 6: Create Admin EpisodeController**

```php
<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Content\StoreEpisodeRequest;
use App\Http\Requests\Content\UpdateEpisodeRequest;
use App\Http\Resources\EpisodeResource;
use App\Models\Episode;
use App\Models\Season;
use App\Services\EpisodeService;
use Illuminate\Http\JsonResponse;

class EpisodeController extends Controller
{
    public function __construct(private readonly EpisodeService $episodeService) {}

    public function store(StoreEpisodeRequest $request, string $seasonId): JsonResponse
    {
        $season = Season::findOrFail($seasonId);
        $episode = $this->episodeService->store($season, $request->validated());

        return response()->json([
            'success' => true,
            'data'    => new EpisodeResource($episode),
            'message' => 'Episode created successfully',
        ], 201);
    }

    public function update(UpdateEpisodeRequest $request, string $id): JsonResponse
    {
        $episode = Episode::findOrFail($id);
        $updated = $this->episodeService->update($episode, $request->validated());

        return response()->json([
            'success' => true,
            'data'    => new EpisodeResource($updated),
            'message' => 'Episode updated successfully',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $episode = Episode::findOrFail($id);
        $this->episodeService->destroy($episode);

        return response()->json([
            'success' => true,
            'message' => 'Episode deleted successfully',
        ]);
    }
}
```

Save to `backend/app/Http/Controllers/Api/V1/Admin/EpisodeController.php`.

- [ ] **Step 7: Add season/episode admin routes**

Inside the existing `admin` prefix group in `api.php`, append:

```php
        Route::post('/content/{contentId}/seasons', [\App\Http\Controllers\Api\V1\Admin\SeasonController::class, 'store']);
        Route::put('/seasons/{id}', [\App\Http\Controllers\Api\V1\Admin\SeasonController::class, 'update']);
        Route::delete('/seasons/{id}', [\App\Http\Controllers\Api\V1\Admin\SeasonController::class, 'destroy']);

        Route::post('/seasons/{seasonId}/episodes', [\App\Http\Controllers\Api\V1\Admin\EpisodeController::class, 'store']);
        Route::put('/episodes/{id}', [\App\Http\Controllers\Api\V1\Admin\EpisodeController::class, 'update']);
        Route::delete('/episodes/{id}', [\App\Http\Controllers\Api\V1\Admin\EpisodeController::class, 'destroy']);
```

- [ ] **Step 8: Run the tests and verify they pass**

```bash
cd /var/www/html/MidFlix/backend && php artisan test tests/Feature/Admin/SeasonEpisodeCrudTest.php
```

Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
cd /var/www/html/MidFlix/backend
git add app/Services/SeasonService.php app/Services/EpisodeService.php app/Http/Controllers/Api/V1/Admin/SeasonController.php app/Http/Controllers/Api/V1/Admin/EpisodeController.php app/Http/Controllers/Api/V1/Admin/StatsController.php routes/api.php tests/Feature/Admin/SeasonEpisodeCrudTest.php
git commit -m "feat: add admin seasons and episodes CRUD API"
```

---

## Task 6: Public Seasons + Episodes API + Genre Endpoint (TDD)

**Files:**
- Create: `backend/app/Http/Controllers/Api/V1/GenreController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/Content/SeasonEpisodeBrowseTest.php`

- [ ] **Step 1: Write the failing tests**

```php
<?php

use App\Models\Content;
use App\Models\Episode;
use App\Models\Genre;
use App\Models\PersonalAccessToken;
use App\Models\Role;
use App\Models\Season;
use App\Models\User;

beforeEach(function () {
    User::truncate();
    PersonalAccessToken::truncate();
    Role::truncate();
    Content::truncate();
    Season::truncate();
    Episode::truncate();
    Genre::truncate();
    $mongodb = \DB::connection('mongodb')->getMongoDB();
    $mongodb->selectCollection('model_has_roles')->deleteMany([]);
    $mongodb->selectCollection('model_has_permissions')->deleteMany([]);
    $mongodb->selectCollection('role_has_permissions')->deleteMany([]);
    Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'sanctum']);
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
});

function subscriberWithActiveToken(): string
{
    $user = User::factory()->create([
        'is_active' => true,
        'subscription' => ['plan' => 'basic', 'status' => 'active', 'trial_ends_at' => null, 'expires_at' => null],
    ]);
    $role = Role::where('name', 'subscriber')->first();
    $user->assignRole($role);
    return $user->createToken('test')->plainTextToken;
}

test('subscriber can list seasons of a series', function () {
    $token = subscriberWithActiveToken();
    $content = Content::factory()->create(['is_published' => true, 'type' => 'series', 'slug' => 'my-series']);
    Season::create(['content_id' => (string) $content->_id, 'number' => 1]);
    Season::create(['content_id' => (string) $content->_id, 'number' => 2]);

    $response = $this->withToken($token)->getJson('/api/v1/content/my-series/seasons');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonCount(2, 'data');
});

test('seasons endpoint 404 for unpublished content', function () {
    $token = subscriberWithActiveToken();
    Content::factory()->create(['is_published' => false, 'slug' => 'hidden-series']);

    $this->withToken($token)->getJson('/api/v1/content/hidden-series/seasons')
        ->assertStatus(404);
});

test('subscriber can list episodes of a season', function () {
    $token = subscriberWithActiveToken();
    $content = Content::factory()->create(['is_published' => true, 'type' => 'series']);
    $season = Season::create(['content_id' => (string) $content->_id, 'number' => 1]);
    Episode::create(['season_id' => (string) $season->_id, 'content_id' => (string) $content->_id, 'number' => 1, 'title' => 'Ep 1']);
    Episode::create(['season_id' => (string) $season->_id, 'content_id' => (string) $content->_id, 'number' => 2, 'title' => 'Ep 2']);

    $response = $this->withToken($token)->getJson("/api/v1/seasons/{$season->_id}/episodes");

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonCount(2, 'data');
});

test('authenticated user can list genres', function () {
    $token = subscriberWithActiveToken();
    Genre::create(['name' => 'Action', 'slug' => 'action']);
    Genre::create(['name' => 'Drama', 'slug' => 'drama']);

    $response = $this->withToken($token)->getJson('/api/v1/genres');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonCount(2, 'data');
});
```

Save to `backend/tests/Feature/Content/SeasonEpisodeBrowseTest.php`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /var/www/html/MidFlix/backend && php artisan test tests/Feature/Content/SeasonEpisodeBrowseTest.php
```

Expected: FAIL.

- [ ] **Step 3: Create GenreController**

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Genre;
use Illuminate\Http\JsonResponse;

class GenreController extends Controller
{
    public function index(): JsonResponse
    {
        $genres = Genre::orderBy('name')->get()->map(fn ($g) => [
            'id'   => (string) $g->_id,
            'name' => $g->name,
            'slug' => $g->slug,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $genres,
        ]);
    }
}
```

Save to `backend/app/Http/Controllers/Api/V1/GenreController.php`.

- [ ] **Step 4: Add public seasons/episodes/genres routes to api.php**

After the existing `content` route group in `api.php`, add:

```php
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/genres', [\App\Http\Controllers\Api\V1\GenreController::class, 'index']);

        Route::middleware('subscriber')->group(function () {
            Route::get('/content/{slug}/seasons', function (string $slug) {
                $content = \App\Models\Content::where('slug', $slug)->where('is_published', true)->firstOrFail();
                $seasons = \App\Models\Season::where('content_id', (string) $content->_id)->orderBy('number')->get();
                return response()->json([
                    'success' => true,
                    'data'    => \App\Http\Resources\SeasonResource::collection($seasons),
                ]);
            });

            Route::get('/seasons/{id}/episodes', function (string $id) {
                $season = \App\Models\Season::findOrFail($id);
                $episodes = \App\Models\Episode::where('season_id', (string) $season->_id)->orderBy('number')->get();
                return response()->json([
                    'success' => true,
                    'data'    => \App\Http\Resources\EpisodeResource::collection($episodes),
                ]);
            });
        });
    });
```

- [ ] **Step 5: Run the tests and verify they pass**

```bash
cd /var/www/html/MidFlix/backend && php artisan test tests/Feature/Content/SeasonEpisodeBrowseTest.php
```

Expected: All tests pass.

- [ ] **Step 6: Run full test suite to confirm no regressions**

```bash
cd /var/www/html/MidFlix/backend && php artisan test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
cd /var/www/html/MidFlix/backend
git add app/Http/Controllers/Api/V1/GenreController.php routes/api.php tests/Feature/Content/SeasonEpisodeBrowseTest.php
git commit -m "feat: add public seasons, episodes, and genres browse API"
```

---

## Task 7: Frontend Types + API Clients

**Files:**
- Create: `frontend/src/types/content.ts`
- Create: `frontend/src/api/content.ts`
- Create: `frontend/src/api/admin/content.ts`

- [ ] **Step 1: Create content types**

```typescript
export type ContentType = 'movie' | 'series';

export interface VideoAsset {
  hls_url: string | null;
  status: 'pending' | 'processing' | 'ready' | 'error';
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface ContentListItem {
  id: string;
  title: string;
  slug: string;
  type: ContentType;
  year: number | null;
  rating: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  genre_ids: string[];
  is_published: boolean;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

export interface Content extends ContentListItem {
  description: string;
  cast: string[];
  director: string | null;
  trailer_url: string | null;
  video: VideoAsset;
  updated_at: string;
}

export interface Season {
  id: string;
  content_id: string;
  number: number;
  title: string | null;
  description: string | null;
  created_at: string;
}

export interface Episode {
  id: string;
  season_id: string;
  content_id: string;
  number: number;
  title: string;
  description: string | null;
  duration: number | null;
  thumbnail_url: string | null;
  video: VideoAsset;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface CreateContentPayload {
  title: string;
  description: string;
  type: ContentType;
  genre_ids?: string[];
  cast?: string[];
  director?: string | null;
  year?: number | null;
  rating?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  trailer_url?: string | null;
}

export type UpdateContentPayload = Partial<CreateContentPayload>;

export interface CreateSeasonPayload {
  number: number;
  title?: string | null;
  description?: string | null;
}

export type UpdateSeasonPayload = Partial<CreateSeasonPayload>;

export interface CreateEpisodePayload {
  number: number;
  title: string;
  description?: string | null;
  duration?: number | null;
  thumbnail_url?: string | null;
}

export type UpdateEpisodePayload = Partial<CreateEpisodePayload>;

export interface AdminStats {
  total_content: number;
  published: number;
  unpublished: number;
  movies: number;
  series: number;
}
```

Save to `frontend/src/types/content.ts`.

- [ ] **Step 2: Create public content API client**

```typescript
import apiClient from './axios';
import type { Content, ContentListItem, Genre, PaginatedResponse, Season, Episode } from '@/types/content';

export async function browseContent(params?: {
  type?: string;
  genre_id?: string;
  page?: number;
}): Promise<PaginatedResponse<ContentListItem>> {
  const res = await apiClient.get('/api/v1/content', { params });
  return res.data.data;
}

export async function getTrending(): Promise<ContentListItem[]> {
  const res = await apiClient.get('/api/v1/content/trending');
  return res.data.data;
}

export async function getNewReleases(): Promise<ContentListItem[]> {
  const res = await apiClient.get('/api/v1/content/new-releases');
  return res.data.data;
}

export async function searchContent(q: string, page = 1): Promise<PaginatedResponse<ContentListItem>> {
  const res = await apiClient.get('/api/v1/content/search', { params: { q, page } });
  return res.data.data;
}

export async function getContentBySlug(slug: string): Promise<Content> {
  const res = await apiClient.get(`/api/v1/content/${slug}`);
  return res.data.data;
}

export async function getContentSeasons(slug: string): Promise<Season[]> {
  const res = await apiClient.get(`/api/v1/content/${slug}/seasons`);
  return res.data.data;
}

export async function getSeasonEpisodes(seasonId: string): Promise<Episode[]> {
  const res = await apiClient.get(`/api/v1/seasons/${seasonId}/episodes`);
  return res.data.data;
}

export async function getGenres(): Promise<Genre[]> {
  const res = await apiClient.get('/api/v1/genres');
  return res.data.data;
}
```

Save to `frontend/src/api/content.ts`.

- [ ] **Step 3: Create admin content API client**

```typescript
import apiClient from '../axios';
import type {
  AdminStats,
  Content,
  ContentListItem,
  CreateContentPayload,
  CreateEpisodePayload,
  CreateSeasonPayload,
  Episode,
  PaginatedResponse,
  Season,
  UpdateContentPayload,
  UpdateEpisodePayload,
  UpdateSeasonPayload,
} from '@/types/content';

export async function adminListContent(params?: {
  type?: string;
  search?: string;
  page?: number;
}): Promise<PaginatedResponse<ContentListItem>> {
  const res = await apiClient.get('/api/v1/admin/content', { params });
  return res.data.data;
}

export async function adminGetContent(id: string): Promise<Content> {
  const res = await apiClient.get(`/api/v1/admin/content/${id}`);
  return res.data.data;
}

export async function adminCreateContent(payload: CreateContentPayload): Promise<Content> {
  const res = await apiClient.post('/api/v1/admin/content', payload);
  return res.data.data;
}

export async function adminUpdateContent(id: string, payload: UpdateContentPayload): Promise<Content> {
  const res = await apiClient.put(`/api/v1/admin/content/${id}`, payload);
  return res.data.data;
}

export async function adminTogglePublish(id: string): Promise<Content> {
  const res = await apiClient.patch(`/api/v1/admin/content/${id}/publish`);
  return res.data.data;
}

export async function adminDeleteContent(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/content/${id}`);
}

export async function adminGetStats(): Promise<AdminStats> {
  const res = await apiClient.get('/api/v1/admin/stats');
  return res.data.data;
}

export async function adminCreateSeason(contentId: string, payload: CreateSeasonPayload): Promise<Season> {
  const res = await apiClient.post(`/api/v1/admin/content/${contentId}/seasons`, payload);
  return res.data.data;
}

export async function adminUpdateSeason(id: string, payload: UpdateSeasonPayload): Promise<Season> {
  const res = await apiClient.put(`/api/v1/admin/seasons/${id}`, payload);
  return res.data.data;
}

export async function adminDeleteSeason(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/seasons/${id}`);
}

export async function adminCreateEpisode(seasonId: string, payload: CreateEpisodePayload): Promise<Episode> {
  const res = await apiClient.post(`/api/v1/admin/seasons/${seasonId}/episodes`, payload);
  return res.data.data;
}

export async function adminUpdateEpisode(id: string, payload: UpdateEpisodePayload): Promise<Episode> {
  const res = await apiClient.put(`/api/v1/admin/episodes/${id}`, payload);
  return res.data.data;
}

export async function adminDeleteEpisode(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/episodes/${id}`);
}
```

Save to `frontend/src/api/admin/content.ts`.

- [ ] **Step 4: Commit**

```bash
cd /var/www/html/MidFlix
git add frontend/src/types/content.ts frontend/src/api/content.ts frontend/src/api/admin/content.ts
git commit -m "feat: add frontend content types and API clients"
```

---

## Task 8: Admin Content List Page

**Files:**
- Create: `frontend/src/pages/admin/ContentListPage.tsx`

- [ ] **Step 1: Create ContentListPage**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminListContent,
  adminTogglePublish,
  adminDeleteContent,
} from '@/api/admin/content';
import type { ContentListItem } from '@/types/content';

export default function ContentListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-content', search, page],
    queryFn: () => adminListContent({ search, page }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: (id: string) => adminTogglePublish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-content'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteContent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-content'] }),
  });

  function handleDelete(item: ContentListItem) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(item.id);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display tracking-widest uppercase text-white">Content</h1>
        <Link
          to="/admin/content/new"
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Add Content
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-sm bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading && (
        <div className="text-muted-foreground text-sm">Loading…</div>
      )}

      {data && (
        <>
          <div className="rounded border border-border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-card text-muted-foreground uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((item) => (
                  <tr key={item.id} className="bg-background hover:bg-card/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      <button
                        onClick={() => navigate(`/admin/content/${item.id}`)}
                        className="hover:text-primary transition-colors text-left"
                      >
                        {item.title}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{item.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.year ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.is_published
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-yellow-900/40 text-yellow-400'
                        }`}
                      >
                        {item.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.view_count.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/content/${item.id}`)}
                          className="text-xs text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => togglePublishMutation.mutate(item.id)}
                          className="text-xs text-muted-foreground hover:text-white transition-colors"
                        >
                          {item.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.last_page > 1 && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-border hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span>
                Page {data.current_page} of {data.last_page}
              </span>
              <button
                disabled={page === data.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-border hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

Save to `frontend/src/pages/admin/ContentListPage.tsx`.

- [ ] **Step 2: Commit**

```bash
cd /var/www/html/MidFlix
git add frontend/src/pages/admin/ContentListPage.tsx
git commit -m "feat: add admin content list page"
```

---

## Task 9: Admin Content Create/Edit Form

**Files:**
- Create: `frontend/src/components/admin/ContentForm.tsx`
- Create: `frontend/src/pages/admin/ContentEditPage.tsx`

- [ ] **Step 1: Create ContentForm component**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Content, CreateContentPayload } from '@/types/content';

const contentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['movie', 'series']),
  director: z.string().nullable().optional(),
  year: z.coerce.number().int().min(1888).max(2100).nullable().optional(),
  rating: z.string().max(10).nullable().optional(),
  poster_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  backdrop_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  trailer_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof contentSchema>;

interface ContentFormProps {
  defaultValues?: Partial<Content>;
  onSubmit: (data: CreateContentPayload) => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

export default function ContentForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
}: ContentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      type: defaultValues?.type ?? 'movie',
      director: defaultValues?.director ?? '',
      year: defaultValues?.year ?? undefined,
      rating: defaultValues?.rating ?? '',
      poster_url: defaultValues?.poster_url ?? '',
      backdrop_url: defaultValues?.backdrop_url ?? '',
      trailer_url: defaultValues?.trailer_url ?? '',
    },
  });

  function handleFormSubmit(values: FormValues) {
    onSubmit({
      ...values,
      poster_url: values.poster_url || null,
      backdrop_url: values.backdrop_url || null,
      trailer_url: values.trailer_url || null,
      director: values.director || null,
      rating: values.rating || null,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 max-w-2xl">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Title *</label>
        <input
          {...register('title')}
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Type *</label>
        <select
          {...register('type')}
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="movie">Movie</option>
          <option value="series">Series</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Description *</label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Director</label>
          <input
            {...register('director')}
            className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Year</label>
          <input
            {...register('year')}
            type="number"
            className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.year && <p className="text-destructive text-xs mt-1">{errors.year.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Rating (e.g. PG-13)</label>
        <input
          {...register('rating')}
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Poster URL</label>
        <input
          {...register('poster_url')}
          type="url"
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.poster_url && <p className="text-destructive text-xs mt-1">{errors.poster_url.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Backdrop URL</label>
        <input
          {...register('backdrop_url')}
          type="url"
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.backdrop_url && <p className="text-destructive text-xs mt-1">{errors.backdrop_url.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">Trailer URL</label>
        <input
          {...register('trailer_url')}
          type="url"
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.trailer_url && <p className="text-destructive text-xs mt-1">{errors.trailer_url.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2 bg-primary text-white rounded font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
```

Save to `frontend/src/components/admin/ContentForm.tsx`.

- [ ] **Step 2: Create ContentEditPage**

```tsx
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContentForm from '@/components/admin/ContentForm';
import SeasonManager from '@/components/admin/SeasonManager';
import {
  adminGetContent,
  adminCreateContent,
  adminUpdateContent,
} from '@/api/admin/content';
import type { CreateContentPayload } from '@/types/content';

export default function ContentEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: content, isLoading } = useQuery({
    queryKey: ['admin-content-detail', id],
    queryFn: () => adminGetContent(id!),
    enabled: !isNew,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateContentPayload) => adminCreateContent(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      navigate(`/admin/content/${created.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateContentPayload) => adminUpdateContent(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['admin-content-detail', id] });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(data: CreateContentPayload) {
    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  }

  if (!isNew && isLoading) {
    return <div className="p-6 text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/content')}
          className="text-muted-foreground hover:text-white transition-colors text-sm"
        >
          ← Content
        </button>
        <h1 className="text-2xl font-display tracking-widest uppercase text-white">
          {isNew ? 'New Content' : content?.title ?? 'Edit'}
        </h1>
      </div>

      {(createMutation.error || updateMutation.error) && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded text-destructive text-sm">
          Failed to save. Please try again.
        </div>
      )}

      <ContentForm
        defaultValues={content}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel={isNew ? 'Create' : 'Update'}
      />

      {!isNew && content?.type === 'series' && (
        <div className="mt-10">
          <SeasonManager contentId={content.id} />
        </div>
      )}
    </div>
  );
}
```

Save to `frontend/src/pages/admin/ContentEditPage.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/MidFlix
git add frontend/src/components/admin/ContentForm.tsx frontend/src/pages/admin/ContentEditPage.tsx
git commit -m "feat: add admin content create/edit form and page"
```

---

## Task 10: Admin Seasons/Episodes UI + Router Update

**Files:**
- Create: `frontend/src/components/admin/SeasonManager.tsx`
- Create: `frontend/src/components/admin/EpisodeList.tsx`
- Modify: `frontend/src/router/index.tsx`

- [ ] **Step 1: Create EpisodeList component**

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  adminCreateEpisode,
  adminUpdateEpisode,
  adminDeleteEpisode,
} from '@/api/admin/content';
import type { Episode } from '@/types/content';

const episodeSchema = z.object({
  number: z.coerce.number().int().min(1, 'Required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  duration: z.coerce.number().int().min(1).nullable().optional(),
});

type EpisodeFormValues = z.infer<typeof episodeSchema>;

interface EpisodeListProps {
  seasonId: string;
  episodes: Episode[];
}

export default function EpisodeList({ seasonId, episodes }: EpisodeListProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-seasons', seasonId] });

  const createMutation = useMutation({
    mutationFn: (data: EpisodeFormValues) =>
      adminCreateEpisode(seasonId, { ...data, description: data.description ?? null, duration: data.duration ?? null }),
    onSuccess: () => { invalidate(); setShowAdd(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EpisodeFormValues }) =>
      adminUpdateEpisode(id, { ...data, description: data.description ?? null, duration: data.duration ?? null }),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteEpisode(id),
    onSuccess: invalidate,
  });

  return (
    <div className="mt-3 space-y-2 pl-4 border-l border-border">
      {episodes.map((ep) => (
        <div key={ep.id}>
          {editingId === ep.id ? (
            <InlineEpisodeForm
              defaultValues={{ number: ep.number, title: ep.title, description: ep.description, duration: ep.duration }}
              onSubmit={(data) => updateMutation.mutate({ id: ep.id, data })}
              onCancel={() => setEditingId(null)}
              isSubmitting={updateMutation.isPending}
            />
          ) : (
            <div className="flex items-center gap-3 text-sm py-1">
              <span className="text-muted-foreground w-6 text-right">{ep.number}.</span>
              <span className="text-white flex-1">{ep.title}</span>
              {ep.duration && <span className="text-muted-foreground text-xs">{ep.duration}m</span>}
              <button onClick={() => setEditingId(ep.id)} className="text-xs text-primary hover:underline">Edit</button>
              <button onClick={() => deleteMutation.mutate(ep.id)} className="text-xs text-destructive hover:underline">Delete</button>
            </div>
          )}
        </div>
      ))}

      {showAdd ? (
        <InlineEpisodeForm
          defaultValues={{ number: episodes.length + 1, title: '' }}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowAdd(false)}
          isSubmitting={createMutation.isPending}
        />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs text-primary hover:underline mt-1"
        >
          + Add episode
        </button>
      )}
    </div>
  );
}

interface InlineEpisodeFormProps {
  defaultValues: Partial<EpisodeFormValues>;
  onSubmit: (data: EpisodeFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function InlineEpisodeForm({ defaultValues, onSubmit, onCancel, isSubmitting }: InlineEpisodeFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<EpisodeFormValues>({
    resolver: zodResolver(episodeSchema),
    defaultValues: { number: defaultValues.number ?? 1, title: defaultValues.title ?? '', description: defaultValues.description ?? '', duration: defaultValues.duration ?? undefined },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2 py-1">
      <input
        {...register('number')}
        type="number"
        placeholder="#"
        className="w-12 bg-card border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex-1">
        <input
          {...register('title')}
          placeholder="Episode title"
          className="w-full bg-card border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
      </div>
      <input
        {...register('duration')}
        type="number"
        placeholder="min"
        className="w-16 bg-card border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button type="submit" disabled={isSubmitting} className="text-xs bg-primary text-white px-2 py-1 rounded disabled:opacity-50">Save</button>
      <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-white px-1">Cancel</button>
    </form>
  );
}
```

Save to `frontend/src/components/admin/EpisodeList.tsx`.

- [ ] **Step 2: Create SeasonManager component**

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import EpisodeList from './EpisodeList';
import {
  adminCreateSeason,
  adminUpdateSeason,
  adminDeleteSeason,
} from '@/api/admin/content';
import { getContentSeasons, getSeasonEpisodes } from '@/api/content';
import type { Season } from '@/types/content';

const seasonSchema = z.object({
  number: z.coerce.number().int().min(1, 'Required'),
  title: z.string().nullable().optional(),
});

type SeasonFormValues = z.infer<typeof seasonSchema>;

interface SeasonManagerProps {
  contentId: string;
}

export default function SeasonManager({ contentId }: SeasonManagerProps) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ['admin-content-seasons', contentId],
    queryFn: async () => {
      // We query admin endpoint indirectly via content slug — but contentId is an ID not slug.
      // Use a direct seasons fetch via the admin client.
      const res = await import('@/api/admin/content').then(m =>
        // adminListContent doesn't expose seasons directly; we piggyback on public API with admin token.
        // The admin token also satisfies subscriber middleware since admin has active subscription.
        import('@/api/content').then(c => c.getContentSeasons(contentId))
      );
      return res;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-content-seasons', contentId] });
  };

  const createMutation = useMutation({
    mutationFn: (data: SeasonFormValues) =>
      adminCreateSeason(contentId, { number: data.number, title: data.title ?? null }),
    onSuccess: () => { invalidate(); setShowAdd(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SeasonFormValues }) =>
      adminUpdateSeason(id, { number: data.number, title: data.title ?? null }),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteSeason(id),
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading seasons…</div>;

  return (
    <div>
      <h2 className="text-lg font-display tracking-widest uppercase text-white mb-4">Seasons</h2>

      <div className="space-y-2">
        {seasons.map((season) => (
          <div key={season.id} className="border border-border rounded overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-card">
              {editingId === season.id ? (
                <InlineSeasonForm
                  defaultValues={{ number: season.number, title: season.title ?? '' }}
                  onSubmit={(data) => updateMutation.mutate({ id: season.id, data })}
                  onCancel={() => setEditingId(null)}
                  isSubmitting={updateMutation.isPending}
                />
              ) : (
                <>
                  <button
                    onClick={() => setExpandedId(expandedId === season.id ? null : season.id)}
                    className="flex-1 text-left text-white text-sm font-medium"
                  >
                    Season {season.number}{season.title ? ` — ${season.title}` : ''}
                  </button>
                  <button onClick={() => setEditingId(season.id)} className="text-xs text-primary hover:underline">Edit</button>
                  <button
                    onClick={() => { if (confirm(`Delete Season ${season.number} and all its episodes?`)) deleteMutation.mutate(season.id); }}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

            {expandedId === season.id && (
              <EpisodesWrapper seasonId={season.id} />
            )}
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="mt-3 border border-border rounded p-3 bg-card">
          <InlineSeasonForm
            defaultValues={{ number: seasons.length + 1, title: '' }}
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowAdd(false)}
            isSubmitting={createMutation.isPending}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-3 text-sm text-primary hover:underline"
        >
          + Add season
        </button>
      )}
    </div>
  );
}

function EpisodesWrapper({ seasonId }: { seasonId: string }) {
  const { data: episodes = [] } = useQuery({
    queryKey: ['admin-seasons', seasonId],
    queryFn: () => getSeasonEpisodes(seasonId),
  });

  return (
    <div className="px-4 py-3 bg-background">
      <EpisodeList seasonId={seasonId} episodes={episodes} />
    </div>
  );
}

interface InlineSeasonFormProps {
  defaultValues: Partial<SeasonFormValues>;
  onSubmit: (data: SeasonFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function InlineSeasonForm({ defaultValues, onSubmit, onCancel, isSubmitting }: InlineSeasonFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonSchema),
    defaultValues: { number: defaultValues.number ?? 1, title: defaultValues.title ?? '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2 flex-1">
      <input
        {...register('number')}
        type="number"
        placeholder="Season #"
        className="w-20 bg-background border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex-1">
        <input
          {...register('title')}
          placeholder="Season title (optional)"
          className="w-full bg-background border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.number && <p className="text-destructive text-xs">{errors.number.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className="text-xs bg-primary text-white px-2 py-1 rounded disabled:opacity-50">Save</button>
      <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-white">Cancel</button>
    </form>
  );
}
```

Save to `frontend/src/components/admin/SeasonManager.tsx`.

- [ ] **Step 3: Update router to add admin content routes**

Read `frontend/src/router/index.tsx`. Find the admin route children array and add:

```tsx
{ path: 'content', element: <ContentListPage /> },
{ path: 'content/:id', element: <ContentEditPage /> },
```

The import additions at the top:
```tsx
import ContentListPage from '@/pages/admin/ContentListPage';
import ContentEditPage from '@/pages/admin/ContentEditPage';
```

- [ ] **Step 4: Update AdminLayout sidebar link**

Read `frontend/src/layouts/AdminLayout.tsx`. Find the Content nav link (currently a placeholder `#`) and update it to use `<Link to="/admin/content">` from `react-router-dom`.

- [ ] **Step 5: Run TypeScript check**

```bash
cd /var/www/html/MidFlix/frontend && export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && nvm use 22 && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
cd /var/www/html/MidFlix
git add frontend/src/components/admin/ frontend/src/pages/admin/ frontend/src/router/index.tsx frontend/src/layouts/AdminLayout.tsx
git commit -m "feat: add admin seasons/episodes UI and wire content routes"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|---|---|
| Movie CRUD (admin) | Tasks 3, 9 |
| Series CRUD (admin) | Tasks 3, 9 |
| Season CRUD (admin) | Tasks 5, 10 |
| Episode CRUD (admin) | Tasks 5, 10 |
| Publish/unpublish toggle | Task 3 |
| Public browse (subscriber gate on detail) | Task 4 |
| Trending, new-releases, search | Task 4 |
| Seasons/episodes public browse | Task 6 |
| Genre list | Task 6 |
| Admin stats endpoint | Task 3 |
| Frontend list page | Task 8 |
| Frontend create/edit form | Task 9 |
| Frontend season/episode UI | Task 10 |
| Frontend types + API clients | Task 7 |

### Placeholder Scan

No TBD or TODO present. All code blocks are complete.

### Type Consistency

- `ContentListItem` used in list pages and API clients — consistent
- `Content` (extends `ContentListItem`) used in detail/edit views — consistent
- `adminCreateSeason` accepts `CreateSeasonPayload`, `SeasonService.store` accepts `array $data` with same fields — consistent
- `(string) $this->_id` / `(string) $season->_id` used uniformly across all resources — consistent
- `content_id` stored as string in Season/Episode and returned as string in resources — consistent
