<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Eloquent\HybridRelations;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Permission\Contracts\Permission as PermissionContract;
use Spatie\Permission\Exceptions\PermissionAlreadyExists;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Guard;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Traits\RefreshesPermissionCache;

class Permission extends Model implements PermissionContract
{
    use HybridRelations;
    use RefreshesPermissionCache;

    protected $connection = 'mongodb';
    protected $collection = 'permissions';

    protected $guarded = [];

    public function __construct(array $attributes = [])
    {
        $attributes['guard_name'] ??= Guard::getDefaultName(static::class);

        parent::__construct($attributes);
    }

    public static function create(array $attributes = [])
    {
        $attributes['guard_name'] ??= Guard::getDefaultName(static::class);

        if (static::where('name', $attributes['name'])->where('guard_name', $attributes['guard_name'])->first()) {
            throw PermissionAlreadyExists::create($attributes['name'], $attributes['guard_name']);
        }

        return static::query()->create($attributes);
    }

    public function roles(): BelongsToMany
    {
        $registrar = app(PermissionRegistrar::class);

        return $this->belongsToMany(
            config('permission.models.role'),
            config('permission.table_names.role_has_permissions'),
            $registrar->pivotPermission,
            $registrar->pivotRole
        );
    }

    public function users(): BelongsToMany
    {
        return $this->morphedByMany(
            getModelForGuard($this->attributes['guard_name'] ?? config('auth.defaults.guard')),
            'model',
            config('permission.table_names.model_has_permissions'),
            app(PermissionRegistrar::class)->pivotPermission,
            config('permission.column_names.model_morph_key')
        );
    }

    public static function findById(int|string $id, ?string $guardName = null): PermissionContract
    {
        $guardName ??= Guard::getDefaultName(static::class);
        $permission = static::where('_id', $id)->where('guard_name', $guardName)->first();

        if (! $permission) {
            throw PermissionDoesNotExist::withId($id, $guardName);
        }

        return $permission;
    }

    public static function findByName(string $name, ?string $guardName = null): PermissionContract
    {
        $guardName ??= Guard::getDefaultName(static::class);
        $permission = static::where('name', $name)->where('guard_name', $guardName)->first();

        if (! $permission) {
            throw PermissionDoesNotExist::create($name, $guardName);
        }

        return $permission;
    }

    public static function findOrCreate(string $name, ?string $guardName = null): PermissionContract
    {
        $guardName ??= Guard::getDefaultName(static::class);
        $permission = static::where('name', $name)->where('guard_name', $guardName)->first();

        if (! $permission) {
            return static::query()->create(['name' => $name, 'guard_name' => $guardName]);
        }

        return $permission;
    }
}
