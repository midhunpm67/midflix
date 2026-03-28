<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'        => ['sometimes', 'string', 'max:255'],
            'description'  => ['sometimes', 'string'],
            'type'         => ['sometimes', 'in:movie,series'],
            'genre_ids'    => ['sometimes', 'array'],
            'genre_ids.*'  => ['string'],
            'cast'         => ['sometimes', 'array'],
            'cast.*'       => ['string'],
            'director'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'year'         => ['sometimes', 'nullable', 'integer', 'min:1888', 'max:2100'],
            'rating'       => ['sometimes', 'nullable', 'in:G,PG,PG-13,R,NC-17,TV-MA,TV-14,TV-PG,TV-G,TV-Y'],
            'poster_url'   => ['sometimes', 'nullable', 'url'],
            'backdrop_url' => ['sometimes', 'nullable', 'url'],
            'trailer_url'  => ['sometimes', 'nullable', 'url'],
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
