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
