<?php

namespace App\Services;

use App\Models\Paiement;

class AdminPaiementCsvExportService
{
    /**
     * @param array<string, mixed> $filters
     * @return array{filename: string, content: string}
     */
    public function export(array $filters): array
    {
        $rows = $this->query($filters)->orderByDesc('created_at')->get();
        $filename = 'paiements_export_' . now()->format('Ymd_His') . '.csv';

        $stream = fopen('php://temp', 'r+');
        fputcsv($stream, $this->headers());

        foreach ($rows as $row) {
            fputcsv($stream, [
                optional($row->created_at)?->toDateTimeString(),
                $row->reference,
                $row->type,
                (string) $row->montant,
                $row->methode_paiement,
                $row->canal_paiement,
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
        $content = stream_get_contents($stream) ?: '';
        fclose($stream);

        return [
            'filename' => $filename,
            'content' => $content,
        ];
    }

    /**
     * @param array<string, mixed> $filters
     */
    private function query(array $filters)
    {
        $query = Paiement::query()
            ->with(['user:id,matricule,nom,prenom,email', 'cotisation:id,mois,annee']);

        $includeRepartition = (bool) ($filters['include_repartition'] ?? false);
        if (!$includeRepartition) {
            $query->whereNull('cotisation_id');
        }

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }

        if (isset($filters['methode_paiement'])) {
            $query->where('methode_paiement', $filters['methode_paiement']);
        }

        if (isset($filters['date_debut'])) {
            $query->whereDate('created_at', '>=', $filters['date_debut']);
        }

        if (isset($filters['date_fin'])) {
            $query->whereDate('created_at', '<=', $filters['date_fin']);
        }

        return $query;
    }

    /**
     * @return list<string>
     */
    private function headers(): array
    {
        return [
            'date_creation',
            'reference',
            'type',
            'montant',
            'methode_paiement',
            'canal_paiement',
            'statut',
            'matricule',
            'nom',
            'prenom',
            'email',
            'mois_cotisation',
            'annee_cotisation',
        ];
    }
}
