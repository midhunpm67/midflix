<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContentListResource;
use App\Http\Resources\ContentResource;
use App\Models\Content;
use App\Services\ContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function __construct(private readonly ContentService $contentService) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->contentService->listPublic($request->only(['type', 'genre_id', 'language']));

        return response()->json([
            'success' => true,
            'data'    => [
                'items'        => ContentListResource::collection($paginator->items()),
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function trending(): JsonResponse
    {
        $items = $this->contentService->trending();

        return response()->json([
            'success' => true,
            'data'    => ContentListResource::collection($items),
        ]);
    }

    public function newReleases(): JsonResponse
    {
        $items = $this->contentService->newReleases();

        return response()->json([
            'success' => true,
            'data'    => ContentListResource::collection($items),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $paginator = $this->contentService->listPublic(['search' => $request->query('q', '')]);

        return response()->json([
            'success' => true,
            'data'    => [
                'items'        => ContentListResource::collection($paginator->items()),
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function languages(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->contentService->languages(),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $content = Content::where('slug', $slug)->where('is_published', true)->firstOrFail();

        $content->increment('view_count');

        return response()->json([
            'success' => true,
            'data'    => new ContentResource($content),
        ]);
    }
}
