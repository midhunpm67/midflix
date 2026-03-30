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

test('unauthenticated user can access genres', function () {
    $this->getJson('/api/v1/genres')->assertStatus(200);
});

test('unauthenticated user can access seasons', function () {
    $content = \App\Models\Content::factory()->create(['is_published' => true, 'slug' => 'public-series', 'type' => 'series']);
    $this->getJson('/api/v1/content/public-series/seasons')->assertStatus(200);
});

test('unauthenticated user can access episodes', function () {
    $content = \App\Models\Content::factory()->create(['is_published' => true, 'type' => 'series']);
    $season = \App\Models\Season::create(['content_id' => (string) $content->_id, 'number' => 1]);
    $this->getJson("/api/v1/seasons/{$season->_id}/episodes")->assertStatus(200);
});

test('episodes endpoint returns 404 for unknown season id', function () {
    $token = subscriberWithActiveToken();
    $this->withToken($token)->getJson('/api/v1/seasons/000000000000000000000000/episodes')
        ->assertStatus(404);
});
