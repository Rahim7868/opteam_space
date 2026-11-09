<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export des audits</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; margin: 20px; }
        h1 { font-size: 18px; color: #0f172a; border-bottom: 2px solid #0d9488; padding-bottom: 8px; }
        .info { font-size: 11px; color: #64748b; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #0d9488; color: #fff; font-weight: 600; padding: 7px 5px; text-align: left; }
        td { border-bottom: 1px solid #e2e8f0; padding: 5px; vertical-align: top; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8; }
    </style>
</head>
<body>
    <h1>Journal d’audit — {{ $categoryLabel }}</h1>
    <div class="info">Exporté le {{ $dateExport }} — Total : {{ $total }} entrées</div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Entité</th>
                <th>ID entité</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            @forelse($logs as $log)
                <tr>
                    <td>{{ $log->created_at?->format('d/m/Y H:i:s') ?? '—' }}</td>
                    <td>{{ $log->user?->nom ?? 'Système' }}</td>
                    <td>{{ $log->action }}</td>
                    <td>{{ $log->entity_type ?? '—' }}</td>
                    <td>{{ $log->entity_id ?? '—' }}</td>
                    <td>{{ $log->description ?? '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:18px;">Aucune entrée d’audit trouvée.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">OPTEAM_SPACE — {{ now()->format('d/m/Y H:i:s') }}</div>
</body>
</html>