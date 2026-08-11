<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BureauChange extends Model
{
    protected $fillable = [
        'numero_ordre', 'designation', 'numero_agrement',
        'date_expiration_agrement', // 
        'representant_legal', 'contact', 'adresse',
        'statut', 'commentaire',
        'created_by', 'validated_by',
        'statut_modification', 'modification_proposee',
        'modification_proposee_par', 'modification_approuvee_par',
        'modification_approuvee_at',
    ];

    protected function casts(): array
    {
        return [
            'modification_proposee' => 'array',
            'date_expiration_agrement' => 'date', // 🔥 AJOUT
        ];
    }

    //  NOUVEAU : Calcul du statut d'expiration
    public function getStatutExpirationAttribute()
    {
        if (!$this->date_expiration_agrement) {
            return null;
        }

        $now = now();
        $expiration = $this->date_expiration_agrement;

        if ($expiration->isPast()) {
            return 'expire';
        }

        if ($expiration->diffInDays($now) <= 30) {
            return 'proche_expiration';
        }

        return 'valide';
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function validateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function modificationProposeePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modification_proposee_par');
    }

    public function modificationApprouveePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modification_approuvee_par');
    }

    public function isEditable(): bool
    {
        return in_array($this->statut, ['en_attente', 'rejete']);
    }
}