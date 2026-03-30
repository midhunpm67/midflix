<?php

use App\Models\Content;
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

test('unauthenticated user can browse content', function () {
    Content::factory()->count(2)->create(['is_published' => true]);
    $this->getJson('/api/v1/content')->assertStatus(200)
        ->assertJsonCount(2, 'data.items');
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
    Content::factory()->create(['is_published' => true, 'title' => 'Batman Begins', 'slug' => 'batman-begins']);
    Content::factory()->create(['is_published' => true, 'title' => 'Superman Returns', 'slug' => 'superman-returns']);

    $response = $this->withToken($token)->getJson('/api/v1/content/search?q=batman');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data.items');
});

test('unauthenticated user can view content detail', function () {
    $content = Content::factory()->create(['is_published' => true, 'slug' => 'public-movie']);

    $this->getJson('/api/v1/content/public-movie')
        ->assertStatus(200)
        ->assertJsonPath('data.slug', 'public-movie');
});
