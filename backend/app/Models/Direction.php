<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Direction extends Model
{
    use HasFactory;

    protected $fillable = [
        'agence_id',
        'libelle',
        'adresse',
        'telephone',
        'email',
    ];

    /**
     * Une direction appartient à une agence.
     */
    public function agence()
    {
        return $this->belongsTo(Agence::class);
    }

    /**
     * Une direction possède plusieurs départements.
     */
    public function departements()
    {
        return $this->hasMany(Departement::class);
    }
}