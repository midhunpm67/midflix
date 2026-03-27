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
    // Re-seed the subscriber role needed for login tests
    Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'sanctum']);
});

test('user can login with correct credentials', function () {
    User::factory()->create(['email' => 'test@example.com']);

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

    $this->withHeader('Authorization', "Bearer $token")
        ->postJson('/api/v1/auth/logout')
        ->assertStatus(200)
        ->assertJson(['success' => true]);

    // Token must be deleted from the database
    expect(PersonalAccessToken::count())->toBe(0);
});

test('logout requires authentication', function () {
    $this->postJson('/api/v1/auth/logout')
        ->assertStatus(401);
});
