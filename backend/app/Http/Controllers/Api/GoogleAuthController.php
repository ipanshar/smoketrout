<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google OAuth
     */
    public function redirect()
    {
        /** @var GoogleProvider $driver */
        $driver = Socialite::driver('google');
        
        return response()->json([
            'url' => $driver
                ->stateless()
                ->redirect()
                ->getTargetUrl(),
        ]);
    }

    /**
     * Handle Google OAuth callback
     */
    public function callback(Request $request)
    {
        try {
            /** @var GoogleProvider $driver */
            $driver = Socialite::driver('google');
            $googleUser = $driver->stateless()->user();

            $user = User::updateOrCreate(
                ['google_id' => $googleUser->getId()],
                [
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'avatar' => $googleUser->getAvatar(),
                    'google_id' => $googleUser->getId(),
                ]
            );

            $token = $user->createToken('auth_token')->plainTextToken;

            // For web frontend - redirect with token
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            
            return redirect()->to($frontendUrl . '/auth/callback?token=' . $token);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Authentication failed',
                'message' => $e->getMessage(),
            ], 401);
        }
    }

    /**
     * Handle Google OAuth for mobile (token-based)
     */
    public function mobileCallback(Request $request)
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        try {
            // Verify the Google ID token via Google's tokeninfo endpoint
            $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $request->id_token,
            ]);

            if ($response->failed()) {
                return response()->json(['error' => 'Invalid token'], 401);
            }

            $payload = $response->json();
            
            // Verify the token is for our app (web, android, or ios client)
            $allowedClientIds = [
                config('services.google.client_id'),
                config('services.google.android_client_id'),
                config('services.google.ios_client_id'),
            ];
            
            if (!in_array($payload['aud'], array_filter($allowedClientIds))) {
                return response()->json(['error' => 'Token not for this app'], 401);
            }

            $user = User::updateOrCreate(
                ['google_id' => $payload['sub']],
                [
                    'name' => $payload['name'] ?? $payload['email'],
                    'email' => $payload['email'],
                    'avatar' => $payload['picture'] ?? null,
                    'google_id' => $payload['sub'],
                ]
            );

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Authentication failed',
                'message' => $e->getMessage(),
            ], 401);
        }
    }
}
