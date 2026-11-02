<?php

namespace App\Imports;

use App\Models\BureauChange;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class BureauChangesImport implements ToCollection, WithHeadingRow
{
    private int $userId;
    public array $errors   = [];
    public int   $imported = 0;
    public int   $skipped  = 0;

    /**
     * Expected columns and their slugified variations/aliases in French & English.
     */
    private const COLUMN_ALIASES = [
        'numero_ordre' => [
            'numero_ordre', 'numero_dordre', 'n_ordre', 'nordre', 'no_ordre', 'num_ordre',
            'numero', 'ordre', 'n', 'no'
        ],
        'designation' => [
            'designation', 'nom', 'nom_du_bureau', 'bureau', 'bureau_de_change',
            'raison_sociale', 'etablissement', 'denomination'
        ],
        'numero_agrement' => [
            'numero_agrement', 'numero_dagrement', 'n_agrement', 'nagrement', 'num_agrement',
            'no_agrement', 'agrement', 'n_dagrement', 'code_agrement', 'ref_agrement'
        ],
        'date_expiration_agrement' => [
            'date_expiration_agrement', 'date_expiration', 'date_exp_agrement', 'expiration_agrement',
            'date_exp', 'date_dexpiration', 'date_dexpiration_dagrement', 'expiration', 'validite'
        ],
        'representant_legal' => [
            'representant_legal', 'representant', 'rep_legal', 'representant_legal_nom',
            'gerant', 'directeur', 'promoteur', 'responsable', 'nom_representant'
        ],
        'contact' => [
            'contact', 'telephone', 'tel', 'phone', 'numero_telephone', 'mobile',
            'contact_telephonique', 'numero_contact', 'contacts'
        ],
        'adresse' => [
            'adresse', 'adress', 'address', 'localisation', 'ville', 'siege', 'emplacement'
        ],
    ];

    public function __construct(int $userId)
    {
        $this->userId = $userId;
    }

    public function collection(Collection $rows): void
    {
        if ($rows->isEmpty()) {
            return;
        }

        $firstRowArray = $rows->first()->toArray();

        // Detect if all content was pasted into Column A as a single comma/semicolon-separated string
        $isSingleColumnCsvInExcel = false;
        $delimiter = null;

        if (count($firstRowArray) === 1) {
            $firstVal = reset($firstRowArray);
            if (is_string($firstVal)) {
                if (strpos($firstVal, ',') !== false) {
                    $isSingleColumnCsvInExcel = true;
                    $delimiter = ',';
                } elseif (strpos($firstVal, ';') !== false) {
                    $isSingleColumnCsvInExcel = true;
                    $delimiter = ';';
                }
            }
        }

        // Map column headers if multi-column
        $columnMap = [];
        if (!$isSingleColumnCsvInExcel) {
            $firstRowKeys = array_keys($firstRowArray);
            $columnMap = $this->resolveColumnMap($firstRowKeys);
        }

        foreach ($rows as $index => $row) {
            $ligne = $index + 2; // Line in Excel (Line 1 = headers)

            if ($isSingleColumnCsvInExcel) {
                $rowArr = $row->toArray();
                $rawString = reset($rowArr);
                $data = $this->extractSingleColumnData($rawString, $delimiter);
            } else {
                $data = $this->extractRowData($row, $columnMap);
            }

            // Skip line if completely empty
            $nonEmptyValues = array_filter($data, fn($v) => $v !== null && trim((string)$v) !== '');
            if (empty($nonEmptyValues)) {
                continue;
            }

            // 1. Check required fields presence
            $missing = [];
            if (empty($data['designation'])) $missing[] = 'Désignation';
            if (empty($data['numero_agrement'])) $missing[] = 'N° agrément';
            if (empty($data['representant_legal'])) $missing[] = 'Représentant légal';
            if (empty($data['contact'])) $missing[] = 'Contact';

            if (!empty($missing)) {
                $this->errors[] = "Ligne {$ligne} : Champ(s) obligatoire(s) manquant(s) (" . implode(', ', $missing) . ").";
                $this->skipped++;
                continue;
            }

            // 2. Parse and format date of expiration if present
            $dateExpiration = null;
            if (!empty($data['date_expiration_agrement'])) {
                $dateExpiration = $this->parseDate($data['date_expiration_agrement']);
                if (!$dateExpiration) {
                    $this->errors[] = "Ligne {$ligne} : Date d'expiration invalide ('{$data['date_expiration_agrement']}'). Format attendu : YYYY-MM-DD ou DD/MM/YYYY.";
                    $this->skipped++;
                    continue;
                }
            }

            // 3. Clean and validate contact number (must yield 9 digits)
            $contactCleaned = $this->cleanContact($data['contact']);
            if (!preg_match('/^[0-9]{9}$/', $contactCleaned)) {
                $this->errors[] = "Ligne {$ligne} : Le contact doit contenir 9 chiffres (valeur lue : '{$data['contact']}').";
                $this->skipped++;
                continue;
            }

            // 4. Check for existing agrement number in DB (y compris les archives)
            $numAgrement = trim((string) $data['numero_agrement']);
            $existing = BureauChange::withTrashed()->where('numero_agrement', $numAgrement)->first();
            if ($existing) {
                $this->errors[] = $existing->trashed()
                    ? "Ligne {$ligne} : N° agrément '{$numAgrement}' présent dans les archives — ignoré (restaurez-le depuis les archives)."
                    : "Ligne {$ligne} : N° agrément '{$numAgrement}' déjà existant dans la base de données — ignoré.";
                $this->skipped++;
                continue;
            }

            // Create record
            BureauChange::create([
                'numero_ordre'              => $data['numero_ordre'] ? trim((string)$data['numero_ordre']) : null,
                'designation'               => trim((string)$data['designation']),
                'numero_agrement'           => $numAgrement,
                'date_expiration_agrement'  => $dateExpiration,
                'representant_legal'        => trim((string)$data['representant_legal']),
                'contact'                   => $contactCleaned,
                'adresse'                   => $data['adresse'] ? trim((string)$data['adresse']) : null,
                'statut'                    => 'en_attente',
                'created_by'                => $this->userId,
            ]);

            $this->imported++;
        }
    }

    /**
     * Map Excel keys to internal column names using normalized slug matching.
     */
    private function resolveColumnMap(array $excelKeys): array
    {
        $map = [];

        // Normalize all excel keys (slug format)
        $normalizedExcelKeys = [];
        foreach ($excelKeys as $rawKey) {
            $normalizedExcelKeys[$rawKey] = Str::slug((string)$rawKey, '_');
        }

        foreach (self::COLUMN_ALIASES as $internalName => $aliases) {
            foreach ($normalizedExcelKeys as $rawKey => $slugKey) {
                if (in_array($slugKey, $aliases, true) || $rawKey === $internalName) {
                    $map[$internalName] = $rawKey;
                    break;
                }
            }
        }

        return $map;
    }

    /**
     * Extract data for a row based on column mapping.
     */
    private function extractRowData($row, array $columnMap): array
    {
        $data = [];

        foreach (self::COLUMN_ALIASES as $internalName => $aliases) {
            if (isset($columnMap[$internalName])) {
                $val = $row[$columnMap[$internalName]] ?? null;
            } else {
                // Fallback: search key directly in row
                $val = $row[$internalName] ?? null;
            }

            $data[$internalName] = $val;
        }

        return $data;
    }

    /**
     * Parse a single string row (when user pasted CSV lines into Column A of Excel).
     * Order: numero_ordre, designation, numero_agrement, date_expiration_agrement, representant_legal, contact, adresse
     */
    private function extractSingleColumnData(?string $rawString, string $delimiter): array
    {
        if (empty($rawString)) {
            return [];
        }

        $parts = array_map('trim', explode($delimiter, $rawString));

        return [
            'numero_ordre'              => $parts[0] ?? null,
            'designation'               => $parts[1] ?? null,
            'numero_agrement'           => $parts[2] ?? null,
            'date_expiration_agrement'  => $parts[3] ?? null,
            'representant_legal'        => $parts[4] ?? null,
            'contact'                   => $parts[5] ?? null,
            'adresse'                   => $parts[6] ?? null,
        ];
    }

    /**
     * Robust date parser for standard, French, and Excel integer dates.
     */
    private function parseDate($value): ?string
    {
        if ($value === null || $value === '') return null;

        // Excel numeric serial date (e.g. 46387)
        if (is_numeric($value) && (float)$value > 10000 && (float)$value < 100000) {
            try {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
            } catch (\Throwable $e) {
                // fallback
            }
        }

        $str = trim((string) $value);

        // Format YYYY-MM-DD
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $str)) {
            return $str;
        }

        // Format DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        if (preg_match('/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/', $str, $m)) {
            $day = str_pad($m[1], 2, '0', STR_PAD_LEFT);
            $month = str_pad($m[2], 2, '0', STR_PAD_LEFT);
            $year = $m[3];
            return "{$year}-{$month}-{$day}";
        }

        // Generic Carbon parse
        try {
            return Carbon::parse($str)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Robust contact cleaner.
     */
    private function cleanContact($value): string
    {
        if ($value === null || $value === '') return '';

        // If numeric float (e.g. 622111111.0)
        if (is_float($value) || (is_numeric($value) && strpos((string)$value, '.') !== false)) {
            $value = sprintf('%.0f', (float)$value);
        }

        $str = (string) $value;
        $digits = preg_replace('/[^0-9]/', '', $str);

        // If international 12 digits starting with country code 224
        if (strlen($digits) === 12 && strpos($digits, '224') === 0) {
            $digits = substr($digits, 3);
        }

        return $digits;
    }
}