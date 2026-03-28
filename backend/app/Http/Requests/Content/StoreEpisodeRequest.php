<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreEpisodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'number'        => ['required', 'integer', 'min:1'],
            'title'         => ['required', 'string', 'max:255'],
            'description'   => ['sometimes', 'nullable', 'string'],
            'duration'      => ['sometimes', 'nullable', 'integer', 'min:1'],
            'thumbnail_url' => ['sometimes', 'nullable', 'url'],
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
