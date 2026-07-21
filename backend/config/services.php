<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'mobile_money' => [
        'mode' => env('MOBILE_MONEY_MODE', 'dev'),
        'auto_confirm_dev' => env('MOBILE_MONEY_AUTO_CONFIRM_DEV', true),
        'webhook_secret' => env('MOBILE_MONEY_WEBHOOK_SECRET', ''),
        'signature_header' => env('MOBILE_MONEY_SIGNATURE_HEADER', 'X-MobileMoney-Signature'),
        'timestamp_header' => env('MOBILE_MONEY_TIMESTAMP_HEADER', 'X-MobileMoney-Timestamp'),
        'enforce_timestamp' => env('MOBILE_MONEY_ENFORCE_TIMESTAMP', true),
        'max_skew_seconds' => env('MOBILE_MONEY_MAX_SKEW_SECONDS', 300),
        'replay_ttl_seconds' => env('MOBILE_MONEY_REPLAY_TTL_SECONDS', 600),
        'webhook_url' => env('MOBILE_MONEY_WEBHOOK_URL', env('APP_URL').'/api/webhook/mobile-money'),
        'wave' => [
            'base_url' => env('WAVE_BASE_URL', 'https://api.wave.com'),
            'api_key' => env('WAVE_API_KEY', ''),
        ],
        'orange_money' => [
            'enabled' => env('ORANGE_MONEY_ENABLED', false),
            'base_url' => env('ORANGE_MONEY_BASE_URL', 'https://api.orange.com'),
            'api_key' => env('ORANGE_MONEY_API_KEY', ''),
        ],
    ],

    'dexpay' => [
        'enabled' => env('DEXPAY_ENABLED', false),
        'mode' => env('DEXPAY_MODE', 'sandbox'),
        'auto_confirm_dev' => env('DEXPAY_AUTO_CONFIRM_DEV', false),
        'public_key' => env('DEXPAY_PUBLIC_KEY', ''),
        'secret_key' => env('DEXPAY_SECRET_KEY', ''),
        'webhook_secret' => env('DEXPAY_WEBHOOK_SECRET', env('DEXPAY_SECRET_KEY', '')),
        'signature_header' => env('DEXPAY_SIGNATURE_HEADER', 'X-Dexchange-Signature'),
        'currency' => env('DEXPAY_CURRENCY', 'XOF'),
        'country_iso' => env('DEXPAY_COUNTRY_ISO', 'SN'),
        'webhook_url' => env('DEXPAY_WEBHOOK_URL', env('APP_URL').'/api/webhook/dexpay'),
        'success_url' => env('DEXPAY_SUCCESS_URL', env('FRONTEND_URL').'/paiement/retour'),
        'failure_url' => env('DEXPAY_FAILURE_URL', env('FRONTEND_URL').'/paiement/annule'),
        'pending_expiration_hours' => env('DEXPAY_PENDING_EXPIRATION_HOURS', 24),
        'channels' => ['wave', 'orange_money', 'free_money', 'wizall', 'card'],
    ],

    'admin_portal' => [
        'registration_secret' => env('ADMIN_PORTAL_REGISTRATION_SECRET', ''),
    ],

    'adhesion' => [
        'application_expiration_hours' => env('ADHESION_APPLICATION_EXPIRATION_HOURS', 24),
        'abandoned_retention_days' => env('ADHESION_ABANDONED_RETENTION_DAYS', 30),
    ],

];
