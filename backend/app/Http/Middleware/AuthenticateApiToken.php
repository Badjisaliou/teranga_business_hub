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
        $portal = strtolower((string) $request->header('X-TBH-Portal', 'member'));
        $cookieName = $portal === 'admin'
            ? (string) config('auth.admin_cookie_name', 'tbh_admin_session')
            : (string) config('auth.member_cookie_name', 'tbh_member_session');
        $bearer = $request->bearerToken() ?: $request->cookie($cookieName);
        if (!$bearer) {
            return response()->json([
                'message' => 'Token manquant.',
                'error_code' => 'token_missing',
            ], 401);
        }

        $hashed = hash('sha256', $bearer);
        $user = User::where('api_token', $hashed)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Token invalide.',
                'error_code' => 'token_invalid',
            ], 401);
        }

        if ($user->statut === 'bloque') {
            $user->api_token = null;
            $user->api_token_created_at = null;
            $user->save();

            return response()->json([
                'message' => 'Espace membre bloque pour defaut de paiement. Veuillez contacter la structure Teranga Business Hub.',
                'error_code' => 'account_blocked',
            ], 403);
        }

        $ttlMinutes = (int) config('auth.api_token_ttl_minutes', 10080);
        if ($ttlMinutes > 0) {
            if (!$user->api_token_created_at || $user->api_token_created_at->addMinutes($ttlMinutes)->isPast()) {
                $user->api_token = null;
                $user->api_token_created_at = null;
                $user->save();

                return response()->json([
                    'message' => 'Token expire.',
                    'error_code' => 'token_expired',
                ], 401);
            }
        }

        Auth::setUser($user);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
