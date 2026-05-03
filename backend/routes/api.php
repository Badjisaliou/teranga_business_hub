<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminExportController;
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
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth.api_token')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/paiement', [PaiementController::class, 'initier']);

    Route::middleware('active.member')->group(function () {
        Route::get('/paiements/historique', [PaiementController::class, 'historique']);
        Route::get('/cotisations', [CotisationController::class, 'index']);
        Route::get('/cotisations/transparence', [CotisationController::class, 'transparence']);
        Route::get('/dashboard', [DashboardController::class, 'userDashboard']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/kyc', [ProfileController::class, 'uploadKyc']);
        Route::delete('/profile/kyc/{document}', [ProfileController::class, 'deleteKycDocument']);
        Route::get('/member-card', [ProfileController::class, 'memberCard']);
    });

    Route::prefix('admin')->middleware('admin.only')->group(function () {
        Route::post('/validate-user', [AdminController::class, 'validateUser']);
        Route::post('/block-user', [AdminController::class, 'blockUser']);
        Route::post('/reject-user', [AdminController::class, 'rejectUser']);
        Route::post('/unblock-user', [AdminController::class, 'unblockUser']);
        Route::get('/blocked-users', [AdminController::class, 'blockedUsers']);
        Route::get('/membres', [AdminController::class, 'membres']);
        Route::get('/dashboard', [DashboardController::class, 'adminDashboard']);
        Route::get('/business-settings', [BusinessSettingsController::class, 'show']);
        Route::put('/business-settings', [BusinessSettingsController::class, 'update']);
        Route::get('/exports/paiements-csv', [AdminExportController::class, 'paiementsCsv']);
    });
});

Route::post('/webhook/mobile-money', [WebhookController::class, 'mobileMoney'])
    ->middleware(['throttle:webhook-mobile-money', 'verify.mobile_money.webhook.signature']);
