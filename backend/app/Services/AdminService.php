<?php

namespace App\Services;

use App\Models\AdminAction;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AdminService
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {
    }

    public function bloquerUtilisateur(User $admin, User $targetUser, ?string $description = null): User
    {
        $this->guardAdminTarget($targetUser);
        $this->guardStatut($targetUser, ['actif'], 'Blocage autorise uniquement pour un membre actif.');

        $targetUser->statut = 'bloque';
        $targetUser->save();
        $this->notificationService->envoyerNotification(
            $targetUser,
            'Votre espace membre a ete bloque. Merci de contacter la structure Teranga Business Hub pour plus d informations.',
            'retard'
        );

        $this->logAction($admin->id, $targetUser->id, 'blocage', $description);

        return $targetUser->refresh();
    }

    public function debloquerUtilisateur(User $admin, User $targetUser, ?string $description = null): User
    {
        $this->guardAdminTarget($targetUser);
        $this->guardStatut($targetUser, ['bloque'], 'Deblocage autorise uniquement pour un membre bloque.');

        $targetUser->statut = 'actif';
        $targetUser->save();
        $this->notificationService->envoyerNotification(
            $targetUser,
            'Votre espace membre a ete debloque. Vous pouvez acceder de nouveau aux services.',
            'paiement'
        );

        $this->logAction($admin->id, $targetUser->id, 'deblocage', $description);

        return $targetUser->refresh();
    }

    public function journaliserLienResetPin(User $admin, User $targetUser, ?string $description = null): void
    {
        $this->guardAdminTarget($targetUser);

        $this->logAction(
            $admin->id,
            $targetUser->id,
            'pin_reset_link',
            $description ?? 'Lien de reinitialisation PIN genere.'
        );
    }

    private function logAction(int $adminId, int $targetUserId, string $action, ?string $description): void
    {
        AdminAction::create([
            'admin_id' => $adminId,
            'cible_user_id' => $targetUserId,
            'action' => $action,
            'description' => $description,
            'date_action' => now(),
        ]);

        Log::info('admin_action_logged', [
            'admin_id' => $adminId,
            'target_user_id' => $targetUserId,
            'action' => $action,
            'description' => $description,
        ]);
    }

    private function guardAdminTarget(User $targetUser): void
    {
        if ($targetUser->role === 'admin') {
            throw ValidationException::withMessages([
                'user_id' => ['Action interdite sur un compte administrateur.'],
            ]);
        }
    }

    /**
     * @param list<string> $authorizedStatuts
     */
    private function guardStatut(User $targetUser, array $authorizedStatuts, string $message): void
    {
        if (!in_array($targetUser->statut, $authorizedStatuts, true)) {
            throw ValidationException::withMessages([
                'user_id' => [$message],
            ]);
        }
    }
}
