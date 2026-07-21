<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminExportController;
use App\Http\Controllers\AdminPaiementController;
use App\Http\Controllers\AdhesionApplicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BusinessSettingsController;
use App\Http\Controllers\CotisationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/register/check', [AuthController::class, 'checkRegistrationData']);
Route::post('/adhesion/start', [AdhesionApplicationController::class, 'start']);
Route::get('/adhesion/payment/status', [AdhesionApplicationController::class, 'statusByReference']);
Route::post('/adhesion/{publicId}/payment', [AdhesionApplicationController::class, 'pay']);
Route::get('/adhesion/{publicId}/status', [AdhesionApplicationController::class, 'status']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/pin/forgot', [AuthController::class, 'forgotPin']);
Route::post('/pin/reset', [AuthController::class, 'resetPin']);
Route::get('/member-card/verify/{token}', [ProfileController::class, 'verifyMemberCard']);

Route::middleware(['auth.api_token', 'cookie.origin'])->group(function () {
    Route::get('/session', [AuthController::class, 'session']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/paiement', [PaiementController::class, 'initier']);
    Route::get('/paiement/status', [PaiementController::class, 'status']);
    Route::get('/paiement/adhesion-state', [PaiementController::class, 'adhesionState']);

    Route::middleware('active.member')->group(function () {
        Route::get('/paiements/historique', [PaiementController::class, 'historique']);
        Route::get('/paiements/cotisation-preview', [PaiementController::class, 'previewCotisation']);
        Route::get('/cotisations', [CotisationController::class, 'index']);
        Route::post('/cotisations/montant-mensuel', [CotisationController::class, 'choisirMontant']);
        Route::get('/cotisations/transparence', [CotisationController::class, 'transparence']);
        Route::get('/dashboard', [DashboardController::class, 'userDashboard']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::get('/member-card', [ProfileController::class, 'memberCard']);
    });

    Route::prefix('admin')->middleware('admin.only')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/block-user', [AdminController::class, 'blockUser']);
        Route::post('/unblock-user', [AdminController::class, 'unblockUser']);
        Route::post('/pin-reset-link', [AdminController::class, 'generatePinResetLink']);
        Route::get('/blocked-users', [AdminController::class, 'blockedUsers']);
        Route::get('/membres', [AdminController::class, 'membres']);
        Route::get('/membres/{user}', [AdminController::class, 'showMember']);
        Route::get('/actions', [AdminController::class, 'adminActions']);
        Route::get('/dashboard', [DashboardController::class, 'adminDashboard']);
        Route::get('/paiements', [AdminPaiementController::class, 'index']);
        Route::post('/paiements/relance', [AdminPaiementController::class, 'relance']);
        Route::get('/business-settings', [BusinessSettingsController::class, 'show']);
        Route::put('/business-settings', [BusinessSettingsController::class, 'update']);
        Route::get('/exports/paiements-csv', [AdminExportController::class, 'paiementsCsv']);
    });
});

Route::post('/webhook/mobile-money', [WebhookController::class, 'mobileMoney'])
    ->middleware(['throttle:webhook-mobile-money', 'verify.mobile_money.webhook.signature']);

Route::post('/webhook/dexpay', [WebhookController::class, 'dexPay'])
    ->middleware('throttle:webhook-mobile-money');
