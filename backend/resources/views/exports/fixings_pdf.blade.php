<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Export Fixings</title>
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
        .variation-positif { color: #16a34a; font-weight: 600; }
        .variation-negatif { color: #dc2626; font-weight: 600; }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <h1>📊 Liste des Fixings</h1>
    <div class="info">
        Total : {{ $total }} fixings
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Devise</th>
                <th>Cours</th>
                <th>Variation</th>
                <th>Créateur</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            @forelse($fixings as $fixing)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($fixing->date_fixing)->format('d/m/Y') }}</td>
                    <td>{{ $fixing->devise }}</td>
                    <td>{{ number_format($fixing->cours, 6, ',', ' ') }}</td>
                    <td>
                        @if($fixing->variation !== null)
                            <span class="{{ $fixing->variation >= 0 ? 'variation-positif' : 'variation-negatif' }}">
                                {{ $fixing->variation >= 0 ? '+' : '' }}{{ number_format($fixing->variation, 6, ',', ' ') }}
                            </span>
                        @else
                            <span style="color:#94a3b8;">N/A</span>
                        @endif
                    </td>
                    <td>{{ $fixing->createur?->nom ?? '—' }}</td>
                    <td>
                        <span class="badge badge-{{ $fixing->statut }}">
                            {{ $fixing->statut }}
                        </span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align:center;color:#94a3b8;padding:20px;">
                        Aucun fixing trouvé.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Exporté le {{ $date_export }} par {{ $auteur_export }}
    </div>
</body>
</html>