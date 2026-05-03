<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $notifications = $user->notificationsMetier()
            ->latest('date_envoi')
            ->latest('id')
            ->get()
            ->map(fn (Notification $notification) => $this->serializeNotification($notification))
            ->values();

        return response()->json([
            'data' => $notifications,
            'meta' => [
                'total' => $notifications->count(),
                'unread_count' => $notifications->where('statut', 'non_lu')->count(),
            ],
        ]);
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        $this->authorizeNotification($request, $notification);

        if ($notification->statut !== 'lu') {
            $notification->update(['statut' => 'lu']);
        }

        return response()->json([
            'message' => 'Notification marquee comme lue.',
            'notification' => $this->serializeNotification($notification->fresh()),
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->notificationsMetier()
            ->where('statut', 'non_lu')
            ->update(['statut' => 'lu']);

        return response()->json([
            'message' => 'Toutes les notifications ont ete marquees comme lues.',
            'meta' => [
                'unread_count' => 0,
            ],
        ]);
    }

    private function authorizeNotification(Request $request, Notification $notification): void
    {
        abort_unless($notification->user_id === $request->user()->id, 404);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeNotification(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'message' => $notification->message,
            'type' => $notification->type,
            'statut' => $notification->statut,
            'date_envoi' => optional($notification->date_envoi)->toIso8601String(),
            'created_at' => optional($notification->created_at)->toIso8601String(),
        ];
    }
}
