<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function envoyerNotification(User $user, string $message, string $type): Notification
    {
        $notification = Notification::create([
            'user_id' => $user->id,
            'message' => $message,
            'type' => $type,
            'statut' => 'non_lu',
            'date_envoi' => now(),
        ]);

        $this->envoyerEmailSiActive($user, $message, $type);

        return $notification;
    }

    private function envoyerEmailSiActive(User $user, string $message, string $type): void
    {
        if (!(bool) config('notifications.email_enabled', false)) {
            return;
        }

        if (empty($user->email)) {
            return;
        }

        $subject = match ($type) {
            'paiement' => 'Mise a jour paiement - Teranga Business Hub',
            'retard' => 'Mise a jour cotisation - Teranga Business Hub',
            default => 'Notification - Teranga Business Hub',
        };

        try {
            Mail::raw($message, function ($mail) use ($user, $subject): void {
                $mail->to($user->email)->subject($subject);
            });
        } catch (\Throwable $e) {
            Log::warning('notification_email_failed', [
                'user_id' => $user->id,
                'email' => $user->email,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
