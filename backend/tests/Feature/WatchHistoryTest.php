<?php

use App\Models\Content;
use App\Models\PersonalAccessToken;
use App\Models\Role;
use App\Models\User;
use App\Models\WatchHistory;

beforeEach(function () {
    User::truncate();
    PersonalAccessToken::truncate();
    Role::truncate();
    Content::truncate();
    WatchHistory::truncate();
    $mongodb = \DB::connection('mongodb')->getMongoDB();
    $mongodb->selectCollection('model_has_roles')->deleteMany([]);
    $mongodb->selectCollection('model_has_permissions')->deleteMany([]);
    $mongodb->selectCollection('role_has_permissions')->deleteMany([]);
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
    Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'sanctum']);
});

function makeSubscriberUser(): array
{
    $user = User::factory()->create(['is_active' => true]);
    $subscriberRole = Role::where('name', 'subscriber')->where('guard_name', 'sanctum')->first();
    $user->assignRole($subscriberRole);
    $token = $user->createToken('test')->plainTextToken;
    return [$user, $token];
}

test('authenticated user can save watch history', function () {
    [$user, $token] = makeSubscriberUser();
    $content = Content::factory()->create(['is_published' => true]);

    $response = $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $content->_id,
        'progress_seconds' => 120,
        'duration_seconds' => 3600,
    ]);

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.content_id', (string) $content->_id)
        ->assertJsonPath('data.progress_seconds', 120)
        ->assertJsonPath('data.duration_seconds', 3600)
        ->assertJsonPath('data.completed', false);

    expect(WatchHistory::count())->toBe(1);
});

test('upsert updates existing record instead of creating a duplicate', function () {
    [$user, $token] = makeSubscriberUser();
    $content = Content::factory()->create(['is_published' => true]);
    $contentId = (string) $content->_id;

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => $contentId,
        'progress_seconds' => 60,
        'duration_seconds' => 3600,
    ]);

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => $contentId,
        'progress_seconds' => 300,
        'duration_seconds' => 3600,
    ]);

    expect(WatchHistory::count())->toBe(1);

    $record = WatchHistory::first();
    expect($record->progress_seconds)->toBe(300);
});

test('completed flag set at 90% threshold', function () {
    [$user, $token] = makeSubscriberUser();
    $content = Content::factory()->create(['is_published' => true]);

    $response = $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $content->_id,
        'progress_seconds' => 90,
        'duration_seconds' => 100,
    ]);

    $response->assertJsonPath('data.completed', true);
});

test('completed flag not set below 90%', function () {
    [$user, $token] = makeSubscriberUser();
    $content = Content::factory()->create(['is_published' => true]);

    $response = $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $content->_id,
        'progress_seconds' => 89,
        'duration_seconds' => 100,
    ]);

    $response->assertJsonPath('data.completed', false);
});

test('user can get their watch progress', function () {
    [$user, $token] = makeSubscriberUser();
    $content = Content::factory()->create(['is_published' => true]);
    $contentId = (string) $content->_id;

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => $contentId,
        'progress_seconds' => 500,
        'duration_seconds' => 3600,
    ]);

    $response = $this->withToken($token)->getJson("/api/v1/me/watch-history/{$contentId}");

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.progress_seconds', 500);
});

test('get progress returns 404 for unknown content', function () {
    [$user, $token] = makeSubscriberUser();

    $response = $this->withToken($token)->getJson('/api/v1/me/watch-history/000000000000000000000000');

    $response->assertStatus(404);
});

test('continue watching returns non-completed records', function () {
    [$user, $token] = makeSubscriberUser();
    $content1 = Content::factory()->create(['is_published' => true]);
    $content2 = Content::factory()->create(['is_published' => true]);

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $content1->_id,
        'progress_seconds' => 300,
        'duration_seconds' => 3600,
    ]);

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $content2->_id,
        'progress_seconds' => 600,
        'duration_seconds' => 7200,
    ]);

    $response = $this->withToken($token)->getJson('/api/v1/me/continue-watching');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonCount(2, 'data');

    $first = $response->json('data.0');
    expect($first)->toHaveKey('content');
    expect($first['content'])->toHaveKey('title');
    expect($first['content'])->toHaveKey('slug');
});

test('continue watching excludes completed records', function () {
    [$user, $token] = makeSubscriberUser();
    $contentIncomplete = Content::factory()->create(['is_published' => true]);
    $contentComplete = Content::factory()->create(['is_published' => true]);

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $contentIncomplete->_id,
        'progress_seconds' => 300,
        'duration_seconds' => 3600,
    ]);

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $contentComplete->_id,
        'progress_seconds' => 3500,
        'duration_seconds' => 3600,
    ]);

    $response = $this->withToken($token)->getJson('/api/v1/me/continue-watching');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.content_id', (string) $contentIncomplete->_id);
});

test('unauthenticated request is rejected', function () {
    $this->postJson('/api/v1/me/watch-history', [
        'content_id'       => 'abc',
        'progress_seconds' => 100,
        'duration_seconds' => 3600,
    ])->assertStatus(401);

    $this->getJson('/api/v1/me/watch-history/abc')->assertStatus(401);
    $this->getJson('/api/v1/me/continue-watching')->assertStatus(401);
});
