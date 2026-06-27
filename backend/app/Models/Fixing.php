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
    ];

    protected function casts(): array
    {
        return ['date_fixing' => 'date'];
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function validateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /** Un fixing en attente peut être modifié */
    public function isEditable(): bool
    {
        return $this->statut === 'en_attente';
    }
}