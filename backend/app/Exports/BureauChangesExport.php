<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Maatwebsite\Excel\Events\AfterSheet;

class BureauChangesExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithCustomStartCell, WithEvents
{
    protected $bureauChanges;

    public function __construct(
        $bureauChanges,
        private readonly string $exportDate,
        private readonly string $exportAuthor
    ) {
        $this->bureauChanges = $bureauChanges;
    }

    public function collection()
    {
        return $this->bureauChanges;
    }

    public function startCell(): string
    {
        return 'A4';
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event): void {
                $sheet = $event->sheet->getDelegate();
                $sheet->setCellValue('A1', 'Exporté le');
                $sheet->setCellValue('B1', $this->exportDate);
                $sheet->setCellValue('A2', 'Exporté par');
                $sheet->setCellValue('B2', $this->exportAuthor);
                $sheet->mergeCells('B1:I1');
                $sheet->mergeCells('B2:I2');
                $sheet->getStyle('A1:I2')->applyFromArray([
                    'font' => ['size' => 10, 'color' => ['rgb' => '475569']],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                ]);
                $sheet->getStyle('A1:A2')->getFont()->setBold(true);
                $sheet->getRowDimension(1)->setRowHeight(20);
                $sheet->getRowDimension(2)->setRowHeight(20);
                $sheet->getRowDimension(3)->setRowHeight(8);
            },
        ];
    }

    public function headings(): array
    {
        return [
            'N° Ordre',
            'Désignation',
            'N° Agrément',
            'Date expiration agrément', // NOUVEAU
            'Représentant',
            'Contact',
            'Adresse',
            'Créé par',
            'Statut'
        ];
    }

    public function map($bureau): array
    {
        return [
            $bureau->numero_ordre,
            $bureau->designation,
            $bureau->numero_agrement,
            $bureau->date_expiration_agrement ? \Carbon\Carbon::parse($bureau->date_expiration_agrement)->format('d/m/Y') : 'N/A', // NOUVEAU
            $bureau->representant_legal,
            $bureau->contact ?? 'N/A',
            $bureau->adresse ?? 'N/A',
            $bureau->createur?->nom ?? '—',
            ucfirst($bureau->statut),
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = max(4, $sheet->getHighestRow());

        // Style de l'en-tête
        $sheet->getStyle('A4:I4')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '0D9488'], // Teal
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Bordure du tableau
        $sheet->getStyle("A4:I{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'E2E8F0'],
                ],
            ],
        ]);

        // Hauteur des lignes
        $sheet->getRowDimension(4)->setRowHeight(25);
        for ($i = 5; $i <= $lastRow; $i++) {
            $sheet->getRowDimension($i)->setRowHeight(20);
        }

        // Largeurs des colonnes
        $sheet->getColumnDimension('A')->setWidth(15);
        $sheet->getColumnDimension('B')->setWidth(30);
        $sheet->getColumnDimension('C')->setWidth(20);
        $sheet->getColumnDimension('D')->setWidth(20); // Date expiration
        $sheet->getColumnDimension('E')->setWidth(25);
        $sheet->getColumnDimension('F')->setWidth(18);
        $sheet->getColumnDimension('G')->setWidth(30);
        $sheet->getColumnDimension('H')->setWidth(20);
        $sheet->getColumnDimension('I')->setWidth(15);

        // Centrer le contenu
        if ($lastRow >= 5) {
            $sheet->getStyle("A5:I{$lastRow}")
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);
        }

        // Alternance des couleurs des lignes
        $rowCount = $sheet->getHighestRow();
        for ($i = 5; $i <= $rowCount; $i++) {
            if ($i % 2 == 0) {
                $sheet->getStyle("A{$i}:I{$i}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F8FAFC'],
                    ],
                ]);
            }
        }

        // Couleurs pour le statut
        for ($i = 5; $i <= $lastRow; $i++) {
            $statut = $sheet->getCell("I{$i}")->getValue();
            $color = match (strtolower($statut)) {
                'valide' => 'DCFCE7',
                'en_attente' => 'FEF08A',
                'rejete' => 'FEE2E2',
                default => 'FFFFFF',
            };
            $sheet->getStyle("I{$i}")->applyFromArray([
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => $color],
                ],
                'font' => [
                    'bold' => true,
                ],
            ]);
        }

        return [];
    }
}