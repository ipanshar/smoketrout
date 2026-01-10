<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Get all roles with their permissions
     */
    public function index()
    {
        $roles = Role::with('permissions')->withCount('users')->get();

        return response()->json([
            'roles' => $roles,
            'modules' => Permission::MODULES,
        ]);
    }

    /**
     * Get all available permissions grouped by module
     */
    public function permissions()
    {
        $permissions = Permission::all()->groupBy('module');

        return response()->json([
            'permissions' => $permissions,
            'modules' => Permission::MODULES,
        ]);
    }

    /**
     * Store a new role
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'display_name' => $validated['display_name'],
            'description' => $validated['description'] ?? null,
        ]);

        if (!empty($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        $role->load('permissions');

        return response()->json([
            'message' => 'Роль успешно создана',
            'role' => $role,
        ], 201);
    }

    /**
     * Get a single role
     */
    public function show(Role $role)
    {
        $role->load('permissions');

        return response()->json([
            'role' => $role,
        ]);
    }

    /**
     * Update a role
     */
    public function update(Request $request, Role $role)
    {
        if ($role->is_system) {
            return response()->json([
                'message' => 'Системную роль нельзя редактировать',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role->update([
            'name' => $validated['name'],
            'display_name' => $validated['display_name'],
            'description' => $validated['description'] ?? null,
        ]);

        if (isset($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        $role->load('permissions');

        return response()->json([
            'message' => 'Роль успешно обновлена',
            'role' => $role,
        ]);
    }

    /**
     * Delete a role
     */
    public function destroy(Role $role)
    {
        if ($role->is_system) {
            return response()->json([
                'message' => 'Системную роль нельзя удалить',
            ], 403);
        }

        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => 'Нельзя удалить роль, которая назначена пользователям',
            ], 422);
        }

        $role->delete();

        return response()->json([
            'message' => 'Роль успешно удалена',
        ]);
    }
}
