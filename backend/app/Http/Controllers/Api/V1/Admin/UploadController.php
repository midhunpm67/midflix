<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'image', 'max:5120'],
            'type' => ['sometimes', 'in:poster,backdrop'],
        ]);

        $type = $request->input('type', 'general');
        $path = $request->file('file')->store("uploads/{$type}", 'public');

        return response()->json([
            'success' => true,
            'data' => [
                'url' => asset("storage/{$path}"),
                'path' => $path,
            ],
        ]);
    }
}
