<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLogger
{
    public static function log(string $action, string $entityType, ?int $entityId = null, ?string $description = null): void
    {
        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
        ]);
    }

    public static function forModel(string $action, Model $model, ?string $description = null): void
    {
        self::log($action, class_basename($model), (int) $model->getKey(), $description);
    }

    public static function logForUser(int $userId, string $action, string $entityType, ?int $entityId = null, ?string $description = null): void
    {
        AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
        ]);
    }

    public static function logLoginAttempt(?int $userId, string $email, bool $successful, ?string $ipAddress): void
    {
        AuditLog::create([
            'user_id' => $userId,
            'action' => 'login',
            'entity_type' => 'User',
            'entity_id' => $userId,
            'description' => $successful ? 'Connexion réussie' : 'Échec de connexion',
            'login_email' => $email,
            'login_status' => $successful ? 'success' : 'failure',
            'ip_address' => $ipAddress,
        ]);
    }
}
