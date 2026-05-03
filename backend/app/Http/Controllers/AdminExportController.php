<?php

namespace App\Http\Controllers;

use App\Models\Paiement;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminExportController extends Controller
{
    public function paiementsCsv(Request $request): Response
    {
        $validated = $request->validate([
            'type' => ['nullable', 'in:adhesion,cotisation'],
            'statut' => ['nullable', 'in:en_attente,succes,echoue'],
            'methode_paiement' => ['nullable', 'in:wave,orange_money'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
            'include_repartition' => ['nullable', 'boolean'],
        ]);

        $query = Paiement::query()
            ->with(['user:id,matricule,nom,prenom,email', 'cotisation:id,mois,annee']);

        $includeRepartition = (bool) ($validated['include_repartition'] ?? false);
        if (!$includeRepartition) {
            $query->whereNull('cotisation_id');
        }

        if (isset($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (isset($validated['statut'])) {
            $query->where('statut', $validated['statut']);
        }

        if (isset($validated['methode_paiement'])) {
            $query->where('methode_paiement', $validated['methode_paiement']);
        }

        if (isset($validated['date_debut'])) {
            $query->whereDate('created_at', '>=', $validated['date_debut']);
        }

        if (isset($validated['date_fin'])) {
            $query->whereDate('created_at', '<=', $validated['date_fin']);
        }

        $rows = $query->orderByDesc('created_at')->get();
        $filename = 'paiements_export_' . now()->format('Ymd_His') . '.csv';

        $stream = fopen('php://temp', 'r+');
        fputcsv($stream, [
            'date_creation',
            'reference',
            'type',
            'montant',
            'methode_paiement',
            'statut',
            'matricule',
            'nom',
            'prenom',
            'email',
            'mois_cotisation',
            'annee_cotisation',
        ]);

        foreach ($rows as $row) {
            fputcsv($stream, [
                optional($row->created_at)?->toDateTimeString(),
                $row->reference,
                $row->type,
                (string) $row->montant,
                $row->methode_paiement,
                $row->statut,
                optional($row->user)->matricule,
                optional($row->user)->nom,
                optional($row->user)->prenom,
                optional($row->user)->email,
                optional($row->cotisation)->mois,
                optional($row->cotisation)->annee,
            ]);
        }

        rewind($stream);
        $csvContent = stream_get_contents($stream) ?: '';
        fclose($stream);

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
