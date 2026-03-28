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
        ->assertJsonPath('data.total_content', 3)
        ->assertJsonPath('data.published', 2)
        ->assertJsonPath('data.unpublished', 1)
        ->assertJsonPath('data.movies', 2)
        ->assertJsonPath('data.series', 1);
});

test('subscriber cannot access admin content endpoints', function () {
    [, $token] = makeSubscriber();

    $this->withToken($token)->getJson('/api/v1/admin/content')
        ->assertStatus(403);
});

test('unauthenticated request is rejected', function () {
    $this->getJson('/api/v1/admin/content')->assertStatus(401);
});

test('show returns 404 for unknown content id', function () {
    [, $token] = makeAdmin();
    $this->withToken($token)->getJson('/api/v1/admin/content/000000000000000000000000')
        ->assertStatus(404);
});

test('admin can create content with video playback_id', function () {
    [, $token] = makeAdmin();

    $response = $this->withToken($token)->postJson('/api/v1/admin/content', [
        'title'       => 'Video Test Movie',
        'description' => 'A movie with a video.',
        'type'        => 'movie',
        'video'       => ['playback_id' => 'abc123testplaybackid'],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.video.playback_id', 'abc123testplaybackid')
        ->assertJsonPath('data.video.status', 'ready');
});

test('updating content with null playback_id sets status to pending', function () {
    [, $token] = makeAdmin();
    $content = Content::factory()->create();

    $response = $this->withToken($token)->putJson("/api/v1/admin/content/{$content->_id}", [
        'video' => ['playback_id' => null],
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.video.playback_id', null)
        ->assertJsonPath('data.video.status', 'pending');
});

test('updating content with playback_id sets status to ready', function () {
    [, $token] = makeAdmin();
    $content = Content::factory()->create();

    $response = $this->withToken($token)->putJson("/api/v1/admin/content/{$content->_id}", [
        'video' => ['playback_id' => 'newplaybackid456'],
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.video.playback_id', 'newplaybackid456')
        ->assertJsonPath('data.video.status', 'ready');
});

test('video playback_id rejects non-string values', function () {
    [, $token] = makeAdmin();

    $response = $this->withToken($token)->postJson('/api/v1/admin/content', [
        'title'       => 'Bad Video',
        'description' => 'Should fail validation.',
        'type'        => 'movie',
        'video'       => ['playback_id' => 12345],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['video.playback_id']);
});
