<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BureauChange extends Model
{
    protected $fillable = [
        'designation', 'numero_agrement',
        'representant_legal', 'contact', 'adresse',
        'statut', 'commentaire',
        'created_by', 'validated_by',
    ];

    public function createur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function validateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function isEditable(): bool
    {
        return $this->statut === 'en_attente';
    }
}