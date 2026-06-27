<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'departement_id',
        'libelle',
        'adresse',
        'telephone',
        'email',
    ];

    /**
     * Un service appartient à un département.
     */
    public function departement()
    {
        return $this->belongsTo(Departement::class);
    }

    /**
     * Un service possède plusieurs utilisateurs.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }
}