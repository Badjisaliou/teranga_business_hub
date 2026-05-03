<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();
        if (!$bearer) {
            return response()->json(['message' => 'Token manquant.'], 401);
        }

        $hashed = hash('sha256', $bearer);
        $user = User::where('api_token', $hashed)->first();

        if (!$user) {
            return response()->json(['message' => 'Token invalide.'], 401);
        }

        if ($user->statut === 'bloque') {
            $user->api_token = null;
            $user->api_token_created_at = null;
            $user->save();

            return response()->json([
                'message' => 'Compte bloque pour defaut de paiement. Veuillez contacter la structure Teranga Business Hub.',
                'error_code' => 'account_blocked',
            ], 403);
        }

        if ($user->statut === 'rejete') {
            $user->api_token = null;
            $user->api_token_created_at = null;
            $user->save();

            return response()->json([
                'message' => 'Inscription non acceptee. Veuillez contacter la structure Teranga Business Hub.',
                'error_code' => 'registration_rejected',
            ], 403);
        }

        $ttlMinutes = (int) config('auth.api_token_ttl_minutes', 10080);
        if ($ttlMinutes > 0) {
            if (!$user->api_token_created_at || $user->api_token_created_at->addMinutes($ttlMinutes)->isPast()) {
                $user->api_token = null;
                $user->api_token_created_at = null;
                $user->save();

                return response()->json(['message' => 'Token expire.'], 401);
            }
        }

        Auth::setUser($user);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
