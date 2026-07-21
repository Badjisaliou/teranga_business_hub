<?php

use App\Http\Middleware\AuthenticateApiToken;
use App\Http\Middleware\EnsureAdminRole;
use App\Http\Middleware\EnsureActiveMember;
use App\Http\Middleware\EnsureTrustedCookieOrigin;
use App\Http\Middleware\VerifyMobileMoneyWebhookSignature;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: [
            'tbh_member_session',
            'tbh_admin_session',
            '__Host-tbh_member_session',
            '__Host-tbh_admin_session',
        ]);

        $middleware->alias([
            'auth.api_token' => AuthenticateApiToken::class,
            'admin.only' => EnsureAdminRole::class,
            'active.member' => EnsureActiveMember::class,
            'cookie.origin' => EnsureTrustedCookieOrigin::class,
            'verify.mobile_money.webhook.signature' => VerifyMobileMoneyWebhookSignature::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (!$request->is('api/*') && !$request->expectsJson()) {
                return null;
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'error_code' => 'validation_error',
                    'errors' => $e->errors(),
                ], 422);
            }

            if ($e instanceof HttpExceptionInterface) {
                $statusCode = $e->getStatusCode();
                $errorCode = match ($statusCode) {
                    401 => 'unauthenticated',
                    403 => 'forbidden',
                    404 => 'not_found',
                    419 => 'session_expired',
                    default => 'http_error',
                };

                return response()->json([
                    'message' => $e->getMessage() ?: 'HTTP error.',
                    'error_code' => $errorCode,
                ], $statusCode);
            }

            Log::channel('stderr')->error('api_unhandled_exception', [
                'exception' => $e::class,
                'code' => (string) $e->getCode(),
                'method' => $request->method(),
                'path' => $request->path(),
            ]);

            return response()->json([
                'message' => 'Internal server error.',
                'error_code' => 'internal_error',
            ], 500);
        });
    })->create();
