<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Content\StoreContentRequest;
use App\Http\Requests\Content\UpdateContentRequest;
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
        $paginator = $this->contentService->listAdmin($request->only(['type', 'search']));

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

    public function store(StoreContentRequest $request): JsonResponse
    {
        $content = $this->contentService->store($request->validated());

        return response()->json([
            'success' => true,
            'data'    => new ContentResource($content),
            'message' => 'Content created successfully',
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $content = Content::findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => new ContentResource($content),
        ]);
    }

    public function update(UpdateContentRequest $request, string $id): JsonResponse
    {
        $content = Content::findOrFail($id);
        $updated = $this->contentService->update($content, $request->validated());

        return response()->json([
            'success' => true,
            'data'    => new ContentResource($updated),
            'message' => 'Content updated successfully',
        ]);
    }

    public function togglePublish(string $id): JsonResponse
    {
        $content = Content::findOrFail($id);
        $updated = $this->contentService->togglePublish($content);

        return response()->json([
            'success' => true,
            'data'    => new ContentResource($updated),
            'message' => $updated->is_published ? 'Content published' : 'Content unpublished',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $content = Content::findOrFail($id);
        $this->contentService->destroy($content);

        return response()->json([
            'success' => true,
            'message' => 'Content deleted successfully',
        ]);
    }
}
