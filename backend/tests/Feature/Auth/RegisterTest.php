<?php

use App\Models\User;

beforeEach(function () {
    \App\Models\User::truncate();
    \App\Models\PersonalAccessToken::truncate();
    \App\Models\Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'web']);
});

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
