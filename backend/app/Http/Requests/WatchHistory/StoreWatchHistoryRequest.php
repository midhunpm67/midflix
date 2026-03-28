<?php

namespace App\Http\Requests\WatchHistory;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreWatchHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content_id'       => ['required', 'string'],
            'episode_id'       => ['sometimes', 'nullable', 'string'],
            'progress_seconds' => ['required', 'integer', 'min:0'],
            'duration_seconds' => ['required', 'integer', 'min:1'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success'    => false,
            'message'    => 'Validation failed',
            'errors'     => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
