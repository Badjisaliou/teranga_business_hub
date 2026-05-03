<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('webhook-mobile-money', function (Request $request) {
            $signature = (string) $request->header(config('services.mobile_money.signature_header', 'X-MobileMoney-Signature'), '');
            $key = $request->ip() . '|' . sha1($signature);

            return Limit::perMinute(60)->by($key);
        });
    }
}
