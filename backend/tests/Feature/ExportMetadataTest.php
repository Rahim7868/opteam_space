<?php

namespace Tests\Feature;

use App\Exports\BureauChangesExport;
use App\Exports\FixingsExport;
use App\Models\BureauChange;
use App\Models\Fixing;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class ExportMetadataTest extends TestCase
{
    use RefreshDatabase;

    public function test_excel_exports_include_export_time_author_and_keep_table_headings(): void
    {
        $exportDate = '14/11/2026 01:00:00';
        $exportAuthor = 'Administrateur Test';
        $fixing = new Fixing([
            'date_fixing' => '2026-11-13',
            'devise' => 'EUR',
            'cours' => 100,
            'statut' => 'en_attente',
        ]);
        $fixing->setRelation('createur', new User(['nom' => $exportAuthor]));
        $fixing->variation = 1.5;

        $fixingsSheet = $this->sheetFromExport(
            new FixingsExport(collect([$fixing]), $exportDate, $exportAuthor)
        );
        $this->assertSame('Exporté le', $fixingsSheet->getCell('A1')->getValue());
        $this->assertSame($exportDate, $fixingsSheet->getCell('B1')->getValue());
        $this->assertSame('Exporté par', $fixingsSheet->getCell('A2')->getValue());
        $this->assertSame($exportAuthor, $fixingsSheet->getCell('B2')->getValue());
        $this->assertSame('📅 Date', $fixingsSheet->getCell('A4')->getValue());
        $this->assertSame('13/11/2026', $fixingsSheet->getCell('A5')->getValue());
        $this->assertSame($exportAuthor, $fixingsSheet->getCell('E5')->getValue());

        $bureau = new BureauChange([
            'numero_ordre' => 'BC-001',
            'designation' => 'Bureau central',
            'numero_agrement' => 'AGR-001',
            'representant_legal' => 'Représentant',
            'statut' => 'en_attente',
        ]);
        $bureau->setRelation('createur', new User(['nom' => $exportAuthor]));
        $bureauChangesSheet = $this->sheetFromExport(
            new BureauChangesExport(collect([$bureau]), $exportDate, $exportAuthor)
        );
        $this->assertSame($exportDate, $bureauChangesSheet->getCell('B1')->getValue());
        $this->assertSame($exportAuthor, $bureauChangesSheet->getCell('B2')->getValue());
        $this->assertSame('N° Ordre', $bureauChangesSheet->getCell('A4')->getValue());
        $this->assertSame('BC-001', $bureauChangesSheet->getCell('A5')->getValue());
        $this->assertSame($exportAuthor, $bureauChangesSheet->getCell('H5')->getValue());
    }

    public function test_export_endpoints_use_the_requesters_timezone_and_name(): void
    {
        $this->travelTo(Carbon::parse('2026-11-13 12:00:00', 'UTC'));
        $user = User::create([
            'nom' => 'Administrateur Test',
            'email' => 'export-metadata@example.test',
            'password' => 'password',
        ]);

        Excel::fake();
        $this->actingAs($user, 'sanctum')
            ->get('/api/export/fixings-excel?timezone=Pacific%2FAuckland')
            ->assertOk();

        Excel::assertDownloaded('fixings_2026-11-14.xlsx', function ($export) use ($user) {
            return $export instanceof FixingsExport
                && $this->exportProperty($export, 'exportDate') === '14/11/2026 01:00:00'
                && $this->exportProperty($export, 'exportAuthor') === $user->nom;
        });

        $this->get('/api/export/bureau-changes-excel?timezone=Pacific%2FAuckland')
            ->assertOk();

        Excel::assertDownloaded('bureaux_change_2026-11-14.xlsx', function ($export) use ($user) {
            return $export instanceof BureauChangesExport
                && $this->exportProperty($export, 'exportDate') === '14/11/2026 01:00:00'
                && $this->exportProperty($export, 'exportAuthor') === $user->nom;
        });

        $fixingsPdf = $this->get('/api/export/fixings-pdf?timezone=Pacific%2FAuckland');
        $fixingsPdf->assertOk();
        $this->assertStringContainsString(
            'fixings_2026-11-14.pdf',
            $fixingsPdf->baseResponse->headers->get('content-disposition')
        );

        $bureauPdf = $this->get('/api/export/bureau-changes-pdf?timezone=Pacific%2FAuckland');
        $bureauPdf->assertOk();
        $this->assertStringContainsString(
            'bureaux_change_2026-11-14.pdf',
            $bureauPdf->baseResponse->headers->get('content-disposition')
        );
    }

    public function test_pdf_templates_print_export_datetime_and_author(): void
    {
        $metadata = [
            'date_export' => '14/11/2026 01:00:00',
            'auteur_export' => 'Administrateur Test',
            'total' => 0,
        ];

        $fixingsHtml = view('exports.fixings_pdf', [
            ...$metadata,
            'fixings' => collect(),
        ])->render();
        $this->assertStringContainsString(
            'Exporté le 14/11/2026 01:00:00 par Administrateur Test',
            $fixingsHtml
        );

        $bureauHtml = view('exports.bureau_changes_pdf', [
            ...$metadata,
            'bureauChanges' => collect(),
        ])->render();
        $this->assertStringContainsString(
            'Exporté le 14/11/2026 01:00:00 par Administrateur Test',
            $bureauHtml
        );
    }

    private function sheetFromExport(object $export): \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet
    {
        $path = tempnam(sys_get_temp_dir(), 'opteam-export-');

        try {
            file_put_contents($path, Excel::raw($export, \Maatwebsite\Excel\Excel::XLSX));
            return IOFactory::load($path)->getActiveSheet();
        } finally {
            unlink($path);
        }
    }

    private function exportProperty(object $export, string $property): mixed
    {
        $reflection = new \ReflectionProperty($export, $property);
        return $reflection->getValue($export);
    }
}
