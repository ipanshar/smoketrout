<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Сменить пароль пользователя
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.required' => 'Введите текущий пароль',
            'new_password.required' => 'Введите новый пароль',
            'new_password.min' => 'Пароль должен содержать минимум :min символов',
            'new_password.confirmed' => 'Пароли не совпадают',
        ]);

        $user = $request->user();

        // Проверяем текущий пароль
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Неверный текущий пароль',
                'errors' => [
                    'current_password' => ['Неверный текущий пароль']
                ]
            ], 422);
        }

        // Обновляем пароль
        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'message' => 'Пароль успешно изменён'
        ]);
    }
}
