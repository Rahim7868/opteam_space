<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Departement extends Model
{
    use HasFactory;

    protected $fillable = [
        'direction_id',
        'libelle',
        'adresse',
        'telephone',
        'email',
    ];

    /**
     * Un département appartient à une direction.
     */
    public function direction()
    {
        return $this->belongsTo(Direction::class);
    }

    /**
     * Un département possède plusieurs services.
     */
    public function services()
    {
        return $this->hasMany(Service::class);
    }
}