<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Fixing extends Model
{
    protected $fillable = [
        'date_fixing', 'devise', 'cours',
        'piece_jointe', 'statut', 'commentaire',
        'created_by', 'validated_by',
        'statut_modification', 'modification_proposee',
        'modification_proposee_par', 'modification_approuvee_par',
        'modification_approuvee_at',
    ];

    protected function casts(): array
    {
        return [
            'date_fixing' => 'date',
            'modification_proposee' => 'array',
        ];
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

    /** Un fixing en attente ou rejeté peut être modifié par son créateur */
    public function isEditable(): bool
    {
        return in_array($this->statut, ['en_attente', 'rejete']);
    }

    public function calculateVariation(): ?float
    {
        $precedent = self::query()
            ->where('devise', $this->devise)
            ->where(function ($query) {
                $query->where('date_fixing', '<', $this->date_fixing)
                    ->orWhere(function ($subQuery) {
                        $subQuery->where('date_fixing', $this->date_fixing)
                            ->where('id', '<', $this->id);
                    });
            })
            ->orderBy('date_fixing', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        return $precedent
            ? round((float) $this->cours - (float) $precedent->cours, 6)
            : null;
    }
}