<?php

use App\Models\Role;
use App\Models\User;
use App\Models\PersonalAccessToken;

beforeEach(function () {
    User::truncate();
    PersonalAccessToken::truncate();
    Role::truncate();
    // Truncate pivot collections using direct MongoDB connection
    $mongodb = \DB::connection('mongodb')->getMongoDB();
    $mongodb->selectCollection('model_has_roles')->deleteMany([]);
    $mongodb->selectCollection('model_has_permissions')->deleteMany([]);
    $mongodb->selectCollection('role_has_permissions')->deleteMany([]);
    // Re-seed the subscriber role needed for me tests
    Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'sanctum']);
});

test('authenticated user can get their profile', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
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

test('me returns correct user data', function () {
    $user = User::factory()->create([
        'name' => 'John Smith',
        'email' => 'john@example.com',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/auth/me');

    $response->assertStatus(200)
        ->assertJsonPath('data.name', 'John Smith')
        ->assertJsonPath('data.email', 'john@example.com')
        ->assertJsonPath('data.role', 'subscriber');
});
