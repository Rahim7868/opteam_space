<?php

namespace App\Imports;

use App\Models\BureauChange;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class BureauChangesImport implements ToCollection, WithHeadingRow, WithValidation
{
    private int $userId;
    public array $errors   = [];
    public int   $imported = 0;
    public int   $skipped  = 0;

    public function __construct(int $userId)
    {
        $this->userId = $userId;
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $ligne = $index + 2; // ligne Excel (commence à 2 car ligne 1 = entêtes)

            // Vérifier si numero_agrement existe déjà
            if (BureauChange::where('numero_agrement', $row['numero_agrement'])->exists()) {
                $this->errors[] = "Ligne {$ligne} : N° agrément '{$row['numero_agrement']}' déjà existant — ignoré.";
                $this->skipped++;
                continue;
            }

            // Nettoyer le contact (retirer les espaces et caractères non numériques)
            $contact = isset($row['contact']) ? preg_replace('/\s+/', '', (string) $row['contact']) : null;

            BureauChange::create([
                'numero_ordre'       => $row['numero_ordre'] ?? null,
                'designation'        => $row['designation'],
                'numero_agrement'    => $row['numero_agrement'],
                'representant_legal' => $row['representant_legal'],
                'contact'            => $contact,
                'adresse'            => $row['adresse'] ?? null,
                'statut'             => 'en_attente',
                'created_by'         => $this->userId,
            ]);

            $this->imported++;
        }
    }

    public function rules(): array
    {
        return [
            '*.designation'        => ['required', 'string'],
            '*.numero_agrement'    => ['required', 'string'],
            '*.representant_legal' => ['required', 'string'],
            '*.contact'            => ['required', 'regex:/^[0-9]{9}$|^\s*[0-9](\s*[0-9]\s*){8}$/'],
        ];
    }

    public function customValidationMessages(): array
    {
        return [
            '*.designation.required'        => 'La colonne designation est obligatoire.',
            '*.numero_agrement.required'    => 'La colonne numero_agrement est obligatoire.',
            '*.representant_legal.required' => 'La colonne representant_legal est obligatoire.',
            '*.contact.required'            => 'La colonne contact est obligatoire.',
            '*.contact.regex'               => 'Le contact doit contenir exactement 9 chiffres (les espaces intermédiaires sont ignorés lors du traitement).',
        ];
    }
}