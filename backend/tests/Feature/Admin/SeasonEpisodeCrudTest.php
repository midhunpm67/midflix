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

test('store season returns 404 for unknown content id', function () {
    $token = adminToken();
    $this->withToken($token)->postJson('/api/v1/admin/content/000000000000000000000000/seasons', [
        'number' => 1,
    ])->assertStatus(404);
});

test('store episode returns 404 for unknown season id', function () {
    $token = adminToken();
    $this->withToken($token)->postJson('/api/v1/admin/seasons/000000000000000000000000/episodes', [
        'number' => 1,
        'title'  => 'Test',
    ])->assertStatus(404);
});
