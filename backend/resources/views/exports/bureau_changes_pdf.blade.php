<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Export Bureaux de change</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            margin: 20px;
        }
        h1 {
            font-size: 18px;
            color: #0f172a;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 8px;
        }
        .info {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background-color: #0d9488;
            color: white;
            font-weight: 600;
            padding: 8px 6px;
            text-align: left;
        }
        td {
            border-bottom: 1px solid #e2e8f0;
            padding: 6px 6px;
        }
        .badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
        }
        .badge-validé { background: #dcfce7; color: #166534; }
        .badge-en_attente { background: #fef08a; color: #854d0e; }
        .badge-rejete { background: #fee2e2; color: #991b1b; }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <h1>🏢 Liste des Bureaux de change</h1>
    <div class="info">
        Exporté le {{ $date_export }} — Total : {{ $total }} bureaux
    </div>

    <table>
        <thead>
            <tr>
                <th>N° Ordre</th>
                <th>Désignation</th>
                <th>N° Agrément</th>
                <th>Représentant</th>
                <th>Contact</th>
                <th>Adresse</th>
                <th>Créé par</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            @forelse($bureauChanges as $bureau)
                <tr>
                    <td>{{ $bureau->numero_ordre }}</td>
                    <td>{{ $bureau->designation }}</td>
                    <td>{{ $bureau->numero_agrement }}</td>
                    <td>{{ $bureau->representant_legal }}</td>
                    <td>{{ $bureau->contact ?? 'N/A' }}</td>
                    <td>{{ $bureau->adresse ?? 'N/A' }}</td>
                    <td>{{ $bureau->createur?->nom ?? '—' }}</td>
                    <td>
                        <span class="badge badge-{{ $bureau->statut }}">
                            {{ $bureau->statut }}
                        </span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" style="text-align:center;color:#94a3b8;padding:20px;">
                        Aucun bureau de change trouvé.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        @generated {{ now()->format('d/m/Y H:i:s') }}
    </div>
</body>
</html>