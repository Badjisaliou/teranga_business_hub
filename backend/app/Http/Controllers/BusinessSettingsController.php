<?php

namespace App\Http\Controllers;

use App\Services\BusinessSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BusinessSettingsController extends Controller
{
    private const SETTINGS_UPDATE_CONFIRMATION = 'CONFIRMER';

    public function __construct(
        private readonly BusinessSettingsService $businessSettingsService,
    ) {
    }

    public function show(): JsonResponse
    {
        return response()->json([
            'settings' => $this->businessSettingsService->all(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array', 'min:1'],
            'settings.cotisation_montant_mensuel' => ['sometimes', 'integer', 'in:5000,10000,20000'],
            'settings.payment_warning_unsold_months_threshold' => ['sometimes', 'integer', 'min:1'],
            'settings.auto_block_unsold_months_threshold' => ['sometimes', 'integer', 'min:1'],
            'confirmation_phrase' => ['nullable', 'string', 'max:50'],
        ]);

        if ((string) ($validated['confirmation_phrase'] ?? '') !== self::SETTINGS_UPDATE_CONFIRMATION) {
            throw ValidationException::withMessages([
                'confirmation_phrase' => ['Saisissez CONFIRMER pour enregistrer les parametres metier.'],
            ]);
        }

        $settings = $this->businessSettingsService->update($validated['settings']);

        return response()->json([
            'message' => 'Parametres metier mis a jour',
            'settings' => $settings,
        ]);
    }
}
