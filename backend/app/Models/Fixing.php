<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Fixing extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date_fixing',
        'devise',
        'cours',
        'status',
        'validated_by',
        'validated_at',
    ];

    protected $casts = [
        'date_fixing' => 'date',
        'cours' => 'decimal:4',
        'validated_at' => 'datetime',
    ];

    // =========================
    // RELATIONS
    // =========================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // =========================
    // VARIATION LOGIC
    // =========================

    public function getVariationAttribute(): float
    {
        $previous = self::where('devise', $this->devise)
            ->where('id', '<', $this->id)
            ->orderByDesc('id')
            ->first();

        if (!$previous) {
            return 0;
        }

        return (float) $this->cours - (float) $previous->cours;
    }
}