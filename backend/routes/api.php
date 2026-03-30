<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

    // Admin routes — auth + admin role required
    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\V1\Admin\StatsController::class, 'index']);
        Route::post('/upload', [\App\Http\Controllers\Api\V1\Admin\UploadController::class, 'store']);

        Route::get('/content', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'index']);
        Route::post('/content', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'store']);
        Route::get('/content/{id}', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'show']);
        Route::put('/content/{id}', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'update']);
        Route::patch('/content/{id}/publish', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'togglePublish']);
        Route::delete('/content/{id}', [\App\Http\Controllers\Api\V1\Admin\ContentController::class, 'destroy']);

        Route::post('/content/{contentId}/seasons', [\App\Http\Controllers\Api\V1\Admin\SeasonController::class, 'store']);
        Route::put('/seasons/{id}', [\App\Http\Controllers\Api\V1\Admin\SeasonController::class, 'update']);
        Route::delete('/seasons/{id}', [\App\Http\Controllers\Api\V1\Admin\SeasonController::class, 'destroy']);

        Route::post('/seasons/{seasonId}/episodes', [\App\Http\Controllers\Api\V1\Admin\EpisodeController::class, 'store']);
        Route::put('/episodes/{id}', [\App\Http\Controllers\Api\V1\Admin\EpisodeController::class, 'update']);
        Route::delete('/episodes/{id}', [\App\Http\Controllers\Api\V1\Admin\EpisodeController::class, 'destroy']);

        Route::get('content/{content}/seasons', [App\Http\Controllers\Api\V1\Admin\SeasonController::class, 'indexForContent']);
        Route::get('seasons/{season}/episodes', [App\Http\Controllers\Api\V1\Admin\EpisodeController::class, 'indexForSeason']);
    });

    // Public content routes — no auth required
    Route::prefix('content')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\V1\ContentController::class, 'index']);
        Route::get('/trending', [\App\Http\Controllers\Api\V1\ContentController::class, 'trending']);
        Route::get('/new-releases', [\App\Http\Controllers\Api\V1\ContentController::class, 'newReleases']);
        Route::get('/search', [\App\Http\Controllers\Api\V1\ContentController::class, 'search']);
        Route::get('/{slug}', [\App\Http\Controllers\Api\V1\ContentController::class, 'show']);
    });

    // Public browse routes — no auth required
    Route::get('/genres', [\App\Http\Controllers\Api\V1\GenreController::class, 'index']);
    Route::get('/content/{slug}/seasons', [\App\Http\Controllers\Api\V1\PublicBrowseController::class, 'seasons']);
    Route::get('/seasons/{id}/episodes', [\App\Http\Controllers\Api\V1\PublicBrowseController::class, 'episodes']);

    // Watch history — auth required (optional feature for logged-in users)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/me/watch-history', [\App\Http\Controllers\Api\V1\WatchHistoryController::class, 'store']);
        Route::get('/me/watch-history/{contentId}', [\App\Http\Controllers\Api\V1\WatchHistoryController::class, 'show']);
        Route::get('/me/continue-watching', [\App\Http\Controllers\Api\V1\WatchHistoryController::class, 'continueWatching']);
    });

});
