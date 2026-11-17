<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class ReportRecipient extends Model
{
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'type',
        'is_active',
        'include_attachments',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'include_attachments' => 'boolean',
        ];
    }
}
