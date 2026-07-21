<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Authentification requise.',
                'error_code' => 'unauthenticated',
            ], 401);
        }

        if ($user->statut === 'actif') {
            return $next($request);
        }

        return response()->json([
            'message' => 'Acces reserve aux membres actifs.',
            'error_code' => 'inactive_account',
        ], 403);
    }
}
