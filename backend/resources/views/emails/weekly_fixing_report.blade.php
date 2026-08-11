<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport hebdomadaire des fixings</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    
                    <!-- En-tête -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 32px 40px;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                                OPTEAM_SPACE
                            </h1>
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: #ccfbf1; font-weight: 400;">
                                Rapport hebdomadaire des fixings
                            </p>
                        </td>
                    </tr>

                    <!-- Corps -->
                    <tr>
                        <td style="padding: 32px 40px;">
                            <!-- Salutation -->
                            <h2 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: #0f172a;">
                                Bonjour {{ $notifiable->nom }},
                            </h2>
                            <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">
                                Voici le résumé des fixings de la semaine :
                            </p>

                            <!-- Période -->
                            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                                <p style="margin: 0; font-size: 14px; font-weight: 500; color: #334155;">
                                    Du {{ $startDate }} au {{ $endDate }}
                                </p>
                            </div>

                            <!-- Statistiques -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 28px;">
                                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: 700; color: #0f172a;">{{ $summary['total'] }}</div>
                                    <div style="font-size: 12px; color: #64748b; font-weight: 500;">Total</div>
                                </div>
                                <div style="background-color: #dcfce7; border-radius: 8px; padding: 16px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: 700; color: #166534;">{{ $summary['valides'] }}</div>
                                    <div style="font-size: 12px; color: #166534; font-weight: 500;">Valides</div>
                                </div>
                                <div style="background-color: #fef08a; border-radius: 8px; padding: 16px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: 700; color: #854d0e;">{{ $summary['en_attente'] }}</div>
                                    <div style="font-size: 12px; color: #854d0e; font-weight: 500;">En attente</div>
                                </div>
                                <div style="background-color: #fee2e2; border-radius: 8px; padding: 16px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: 700; color: #991b1b;">{{ $summary['rejetes'] }}</div>
                                    <div style="font-size: 12px; color: #991b1b; font-weight: 500;">Rejetes</div>
                                </div>
                            </div>

                            <!-- Détail par devise -->
                            <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #0f172a;">Detail par devise</p>
                                <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">
                                    {{ $summary['par_devise'] }}
                                </p>
                            </div>

                            <!-- Liste des fixings -->
                            @if($fixings->count() > 0)
                                <div style="margin-bottom: 24px;">
                                    <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                                        Liste des fixings ({{ $fixings->count() }})
                                    </p>
                                    <table width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                        <thead>
                                            <tr style="background-color: #f1f5f9;">
                                                <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;">Devise</th>
                                                <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Cours</th>
                                                <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Date</th>
                                                <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #475569; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @foreach($fixings as $fixing)
                                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                                    <td style="padding: 10px 12px; font-size: 13px; color: #0f172a; font-weight: 500;">{{ $fixing->devise }}</td>
                                                    <td style="padding: 10px 12px; font-size: 13px; color: #0f172a; text-align: center;">{{ number_format($fixing->cours, 4, ',', ' ') }}</td>
                                                    <td style="padding: 10px 12px; font-size: 13px; color: #0f172a; text-align: center;">{{ \Carbon\Carbon::parse($fixing->date_fixing)->format('d/m/Y') }}</td>
                                                    <td style="padding: 10px 12px; text-align: center;">
                                                        <span style="display: inline-block; padding: 2px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;
                                                            @switch($fixing->statut)
                                                                @case('valide') background-color: #dcfce7; color: #166534; @break
                                                                @case('en_attente') background-color: #fef08a; color: #854d0e; @break
                                                                @case('rejete') background-color: #fee2e2; color: #991b1b; @break
                                                                @default background-color: #f1f5f9; color: #475569;
                                                            @endswitch
                                                        ">
                                                            {{ ucfirst($fixing->statut) }}
                                                        </span>
                                                    </td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            @endif

                            <!-- Bouton -->
                            <div style="text-align: center; margin-top: 24px;">
                                <a href="{{ url('/') }}" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; text-align: center; transition: background-color 0.2s;">
                                    Voir tous les fixings
                                </a>
                            </div>

                            <!-- Pied de page -->
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;">
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                                OPTEAM_SPACE • Gestion des fixings de change<br>
                                Ce rapport est envoyé automatiquement chaque semaine.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>