<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport {{ $frequencyLabel }} des fixings</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 700px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background-color: #3d50b8; padding: 32px 40px;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">OPTEAM_SPACE</h1>
                            <p style="margin: 8px 0 0; font-size: 14px; color: #e0e5ff;">Rapport {{ $frequencyLabel }} des fixings</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 40px;">
                            <h2 style="margin: 0 0 8px; font-size: 18px; color: #0f172a;">
                                Bonjour {{ $notifiable->name ?: $notifiable->email }},
                            </h2>
                            <p style="margin: 0 0 20px; font-size: 14px; color: #64748b;">
                                Voici le rapport des fixings pour la période indiquée ci-dessous.
                            </p>
                            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                                <strong style="font-size: 14px; color: #334155;">Du {{ $startDate }} au {{ $endDate }}</strong>
                            </div>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; text-align: center;">
                                <tr>
                                    <td style="padding: 14px; background: #f1f5f9; border-radius: 8px;"><strong>{{ $summary['total'] }}</strong><br><span style="font-size: 12px; color: #64748b;">Total</span></td>
                                    <td width="8"></td>
                                    <td style="padding: 14px; background: #dcfce7; border-radius: 8px;"><strong>{{ $summary['valides'] }}</strong><br><span style="font-size: 12px; color: #166534;">Validés</span></td>
                                    <td width="8"></td>
                                    <td style="padding: 14px; background: #fef08a; border-radius: 8px;"><strong>{{ $summary['en_attente'] }}</strong><br><span style="font-size: 12px; color: #854d0e;">En attente</span></td>
                                    <td width="8"></td>
                                    <td style="padding: 14px; background: #fee2e2; border-radius: 8px;"><strong>{{ $summary['rejetes'] }}</strong><br><span style="font-size: 12px; color: #991b1b;">Rejetés</span></td>
                                </tr>
                            </table>
                            <p style="font-size: 13px; color: #475569;"><strong>Détail par devise :</strong> {{ $summary['par_devise'] }}</p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e2e8f0;">
                                <thead>
                                    <tr style="background-color: #f1f5f9;">
                                        <th style="padding: 10px; text-align: left;">Devise</th>
                                        <th style="padding: 10px; text-align: center;">Cours</th>
                                        <th style="padding: 10px; text-align: center;">Date</th>
                                        <th style="padding: 10px; text-align: center;">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($fixings as $fixing)
                                        <tr style="border-top: 1px solid #e2e8f0;">
                                            <td style="padding: 10px;">{{ $fixing->devise }}</td>
                                            <td style="padding: 10px; text-align: center;">{{ number_format($fixing->cours, 4, ',', ' ') }}</td>
                                            <td style="padding: 10px; text-align: center;">{{ $fixing->date_fixing->format('d/m/Y') }}</td>
                                            <td style="padding: 10px; text-align: center;">{{ ucfirst(str_replace('_', ' ', $fixing->statut)) }}</td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0 16px;">
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                                OPTEAM_SPACE • Ce rapport est envoyé automatiquement selon la fréquence configurée.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
