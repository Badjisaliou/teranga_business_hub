<?php

namespace App\Services;

use App\Models\AdminAction;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AdminService
{
    public function __construct(
        private readonly CotisationService $cotisationService,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function validerUtilisateur(User $admin, User $targetUser, ?string $description = null): User
    {
        $this->guardAdminTarget($targetUser);
        $this->guardStatut($targetUser, ['en_attente'], 'Validation autorisee uniquement pour un compte en attente.');

        $targetUser->statut = 'attente_adhesion';
        $targetUser->save();
        $this->cotisationService->creerEcheancierAnnuelDepuisMoisCourant($targetUser);
        $this->notificationService->envoyerNotification(
            $targetUser,
            'Votre inscription a ete validee. Votre compte est maintenant en attente d adhesion (10000 FCFA).',
            'paiement'
        );

        $this->logAction($admin->id, $targetUser->id, 'validation', $description);

        return $targetUser->refresh();
    }

    public function bloquerUtilisateur(User $admin, User $targetUser, ?string $description = null): User
    {
        $this->guardAdminTarget($targetUser);
        $this->guardStatut($targetUser, ['actif'], 'Blocage autorise uniquement pour un membre actif.');

        $targetUser->statut = 'bloque';
        $targetUser->save();
        $this->notificationService->envoyerNotification(
            $targetUser,
            'Votre compte a ete bloque. Merci de contacter la structure Teranga Business Hub pour plus d informations.',
            'retard'
        );

        $this->logAction($admin->id, $targetUser->id, 'blocage', $description);

        return $targetUser->refresh();
    }

    public function rejeterUtilisateur(User $admin, User $targetUser, ?string $description = null): User
    {
        $this->guardAdminTarget($targetUser);
        $this->guardStatut($targetUser, ['en_attente'], 'Rejet autorise uniquement pour un compte en attente.');

        $targetUser->statut = 'rejete';
        $targetUser->save();
        $this->notificationService->envoyerNotification(
            $targetUser,
            'Votre inscription n a pas ete acceptee. Merci de contacter la structure Teranga Business Hub.',
            'paiement'
        );

        $this->logAction($admin->id, $targetUser->id, 'rejet', $description);

        return $targetUser->refresh();
    }

    public function debloquerUtilisateur(User $admin, User $targetUser, ?string $description = null): User
    {
        $this->guardAdminTarget($targetUser);
        $this->guardStatut($targetUser, ['bloque'], 'Deblocage autorise uniquement pour un compte bloque.');

        $targetUser->statut = $targetUser->date_adhesion ? 'actif' : 'attente_adhesion';
        $targetUser->save();
        $this->notificationService->envoyerNotification(
            $targetUser,
            $targetUser->statut === 'actif'
                ? 'Votre compte a ete debloque. Vous pouvez acceder de nouveau aux services.'
                : 'Votre compte a ete debloque. Merci de regler les frais d adhesion pour activer votre espace membre.',
            'paiement'
        );

        $this->logAction($admin->id, $targetUser->id, 'deblocage', $description);

        return $targetUser->refresh();
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
