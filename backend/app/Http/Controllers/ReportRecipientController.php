<?php

namespace App\Http\Controllers;

use App\Models\ReportRecipient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportRecipientController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => ReportRecipient::query()
                ->orderBy('name')
                ->orderBy('email')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $recipient = ReportRecipient::create($this->validatedData($request));

        return response()->json([
            'message' => 'Destinataire ajouté.',
            'data' => $recipient,
        ], 201);
    }

    public function update(Request $request, ReportRecipient $reportRecipient): JsonResponse
    {
        $reportRecipient->update($this->validatedData($request, $reportRecipient));

        return response()->json([
            'message' => 'Destinataire modifié.',
            'data' => $reportRecipient->fresh(),
        ]);
    }

    public function updateStatus(Request $request, ReportRecipient $reportRecipient): JsonResponse
    {
        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $reportRecipient->update($data);

        return response()->json([
            'message' => $reportRecipient->is_active
                ? 'Les envois ont été repris.'
                : 'Les envois ont été mis en pause.',
            'data' => $reportRecipient->fresh(),
        ]);
    }

    public function updateAttachments(Request $request, ReportRecipient $reportRecipient): JsonResponse
    {
        $data = $request->validate([
            'include_attachments' => ['required', 'boolean'],
        ]);

        $reportRecipient->update($data);

        return response()->json([
            'message' => $reportRecipient->include_attachments
                ? 'Les pièces jointes seront incluses.'
                : 'Les pièces jointes ne seront plus incluses.',
            'data' => $reportRecipient->fresh(),
        ]);
    }

    public function destroy(ReportRecipient $reportRecipient): JsonResponse
    {
        $reportRecipient->delete();

        return response()->json(['message' => 'Destinataire supprimé.']);
    }

    private function validatedData(Request $request, ?ReportRecipient $reportRecipient = null): array
    {
        $emailRule = Rule::unique('report_recipients', 'email');
        if ($reportRecipient !== null) {
            $emailRule->ignore($reportRecipient->id);
        }

        return $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                $emailRule,
            ],
            'type' => ['required', Rule::in(['daily', 'weekly', 'monthly', 'daily_weekly'])],
            'is_active' => ['required', 'boolean'],
            'include_attachments' => ['required', 'boolean'],
        ]);
    }
}
