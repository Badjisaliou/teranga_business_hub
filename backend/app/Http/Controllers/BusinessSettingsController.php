<?php

namespace App\Http\Controllers;

use App\Services\BusinessSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessSettingsController extends Controller
{
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
            'settings.cotisation_montant_mensuel' => ['sometimes', 'integer', 'min:1'],
            'settings.auto_block_unsold_months_threshold' => ['sometimes', 'integer', 'min:1'],
        ]);

        $settings = $this->businessSettingsService->update($validated['settings']);

        return response()->json([
            'message' => 'Parametres metier mis a jour',
            'settings' => $settings,
        ]);
    }
}
