<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get all users with their roles
     */
    public function index(Request $request)
    {
        $query = User::with('role')
            ->select(['id', 'name', 'email', 'avatar', 'role_id', 'last_activity_at', 'created_at']);

        // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->has('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        // Order by last activity
        $query->orderByDesc('last_activity_at');

        $users = $query->paginate($request->per_page ?? 15);

        return response()->json($users);
    }

    /**
     * Get a single user
     */
    public function show(User $user)
    {
        $user->load('role.permissions');

        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Create a new user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id' => 'nullable|exists:roles,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'] ?? null,
        ]);

        $user->load('role');

        return response()->json([
            'message' => 'Пользователь успешно создан',
            'user' => $user,
        ], 201);
    }

    /**
     * Update user
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'sometimes|nullable|string|min:8',
            'role_id' => 'nullable|exists:roles,id',
        ]);

        $updateData = [];

        if (isset($validated['name'])) {
            $updateData['name'] = $validated['name'];
        }

        if (isset($validated['email'])) {
            $updateData['email'] = $validated['email'];
        }

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        if (array_key_exists('role_id', $validated)) {
            $updateData['role_id'] = $validated['role_id'];
        }

        $user->update($updateData);
        $user->load('role');

        return response()->json([
            'message' => 'Пользователь успешно обновлён',
            'user' => $user,
        ]);
    }

    /**
     * Assign role to user
     */
    public function assignRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role_id' => 'nullable|exists:roles,id',
        ]);

        $user->update(['role_id' => $validated['role_id']]);
        $user->load('role');

        return response()->json([
            'message' => 'Роль успешно назначена',
            'user' => $user,
        ]);
    }

    /**
     * Delete user
     */
    public function destroy(User $user)
    {
        // Prevent self-deletion
        /** @var \App\Models\User|null $currentUser */
        $currentUser = auth()->user();
        if ($currentUser && $user->id === $currentUser->id) {
            return response()->json([
                'message' => 'Вы не можете удалить свой аккаунт',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'Пользователь успешно удалён',
        ]);
    }

    /**
     * Get all roles for dropdown
     */
    public function roles()
    {
        $roles = Role::select(['id', 'name', 'display_name'])->get();

        return response()->json([
            'roles' => $roles,
        ]);
    }
}
