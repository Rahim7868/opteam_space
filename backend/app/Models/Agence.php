<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Agence extends Model
{
    use HasFactory;

    protected $fillable = [
        'libelle',
        'adresse',
        'telephone',
        'email',
    ];

    /**
     * Une agence possède plusieurs directions.
     */
    public function directions()
    {
        return $this->hasMany(Direction::class);
    }
}