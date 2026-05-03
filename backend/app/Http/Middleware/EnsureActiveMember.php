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
            return response()->json(['message' => 'Authentification requise.'], 401);
        }

        if ($user->statut === 'actif') {
            return $next($request);
        }

        if ($user->statut === 'attente_adhesion') {
            return response()->json([
                'message' => 'Compte en attente d adhesion. Veuillez payer 10000 FCFA pour activer votre espace membre.',
                'error_code' => 'adhesion_required',
            ], 403);
        }

        return response()->json([
            'message' => 'Acces reserve aux membres actifs.',
            'error_code' => 'inactive_account',
        ], 403);
    }
}
