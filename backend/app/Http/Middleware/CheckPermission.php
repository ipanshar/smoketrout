<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Admin has all permissions
        if ($user->isAdmin()) {
            return $next($request);
        }

        if (!$user->hasPermission($permission)) {
            return response()->json([
                'message' => 'У вас нет прав для выполнения этого действия',
            ], 403);
        }

        return $next($request);
    }
}
