<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyMobileMoneyWebhookSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = (string) config('services.mobile_money.webhook_secret', '');
        $headerName = (string) config('services.mobile_money.signature_header', 'X-MobileMoney-Signature');
        $timestampHeaderName = (string) config('services.mobile_money.timestamp_header', 'X-MobileMoney-Timestamp');
        $enforceTimestamp = (bool) config('services.mobile_money.enforce_timestamp', true);
        $maxSkewSeconds = max((int) config('services.mobile_money.max_skew_seconds', 300), 1);
        $replayTtlSeconds = max((int) config('services.mobile_money.replay_ttl_seconds', 600), 1);
        $incoming = (string) $request->header($headerName, '');
        $timestampRaw = (string) $request->header($timestampHeaderName, '');

        if ($secret === '' || $incoming === '') {
            return response()->json(['message' => 'Signature webhook manquante.'], 401);
        }

        if ($enforceTimestamp) {
            if ($timestampRaw === '' || !ctype_digit($timestampRaw)) {
                return response()->json(['message' => 'Horodatage webhook manquant ou invalide.'], 401);
            }

            $timestamp = (int) $timestampRaw;
            if (abs(time() - $timestamp) > $maxSkewSeconds) {
                return response()->json(['message' => 'Webhook expire (horodatage hors fenetre).'], 401);
            }
        } else {
            $timestamp = 0;
        }

        $payload = $request->getContent();
        $signedPayload = $enforceTimestamp ? ($timestampRaw . '.' . $payload) : $payload;
        $computed = hash_hmac('sha256', $signedPayload, $secret);
        if (!hash_equals($computed, $incoming)) {
            return response()->json(['message' => 'Signature webhook invalide.'], 401);
        }

        if ($enforceTimestamp) {
            $replayKey = 'mobile_money_webhook_replay:' . hash('sha256', $incoming . '|' . $timestampRaw);
            if (!Cache::add($replayKey, true, $replayTtlSeconds)) {
                return response()->json(['message' => 'Webhook rejoue detecte.'], 409);
            }
        }

        return $next($request);
    }
}
