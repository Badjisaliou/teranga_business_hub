<?php

namespace App\Http\Controllers;

use App\Services\AdminPaiementCsvExportService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminExportController extends Controller
{
    public function __construct(private readonly AdminPaiementCsvExportService $csvExportService)
    {
    }

    public function paiementsCsv(Request $request): Response
    {
        $validated = $request->validate([
            'type' => ['nullable', 'in:adhesion,cotisation'],
            'statut' => ['nullable', 'in:en_attente,succes,echoue'],
            'methode_paiement' => ['nullable', 'in:wave,orange_money,dexpay'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
            'include_repartition' => ['nullable', 'boolean'],
        ]);

        $export = $this->csvExportService->export($validated);

        return response($export['content'], 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $export['filename'] . '"',
        ]);
    }
}
