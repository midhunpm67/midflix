<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateEpisodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'number'        => ['sometimes', 'integer', 'min:1'],
            'title'         => ['sometimes', 'string', 'max:255'],
            'description'   => ['sometimes', 'nullable', 'string'],
            'duration'      => ['sometimes', 'nullable', 'integer', 'min:1'],
            'thumbnail_url' => ['sometimes', 'nullable', 'url'],
            'video'              => ['sometimes', 'array'],
            'video.playback_id'  => ['sometimes', 'nullable', 'string', 'max:100'],
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
