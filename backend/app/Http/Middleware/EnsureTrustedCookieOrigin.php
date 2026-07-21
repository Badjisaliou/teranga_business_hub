<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTrustedCookieOrigin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethodSafe() || $request->bearerToken()) {
            return $next($request);
        }

        $cookieNames = [
            (string) config('auth.member_cookie_name', 'tbh_member_session'),
            (string) config('auth.admin_cookie_name', 'tbh_admin_session'),
        ];
        if (!$request->cookies->has($cookieNames[0]) && !$request->cookies->has($cookieNames[1])) {
            return $next($request);
        }

        $origin = rtrim((string) $request->header('Origin', ''), '/');
        $trustedOrigins = array_map(
            static fn (string $trusted): string => rtrim($trusted, '/'),
            array_filter((array) config('cors.allowed_origins', []), 'is_string')
        );

        if ($origin === '' || !in_array($origin, $trustedOrigins, true)) {
            return response()->json([
                'message' => 'Origine de requete non autorisee.',
                'error_code' => 'untrusted_origin',
            ], 403);
        }

        return $next($request);
    }
}
