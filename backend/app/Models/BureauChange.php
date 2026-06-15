<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BureauChange extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero_ordre',
        'designation',
        'numero_agrement',
        'representant_legal',
        'contact',
        'addresse',
        'status',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}