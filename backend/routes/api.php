<?php

use App\Http\Controllers\ExportController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\AgenceController;
use App\Http\Controllers\DirectionController;
use App\Http\Controllers\DepartementController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\FixingController;
use App\Http\Controllers\BureauChangeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ForgotPasswordController;
use Illuminate\Support\Facades\Route;

// ── Auth publique avec rate limiting strict ────────────────────
//Maximum 5 tentatives par minute par IP
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
});

// ── Routes mot de passe oublié (avec rate limiting) ───────────
Route::middleware('throttle:5,10')->group(function () {
    Route::post('/password/email', [ForgotPasswordController::class, 'sendResetLinkEmail']);
    Route::post('/password/reset', [ForgotPasswordController::class, 'resetPassword']);
});

// ── Auth protégée ─────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    
    // ── Export Fixings ──────────────────────────────────────────
    Route::get('/export/fixings-pdf', [ExportController::class, 'exportFixingsPdf']);
    Route::get('/export/fixings-excel', [ExportController::class, 'exportFixingsExcel']);
    
    // ── Export Bureaux de change ────────────────────────────────
    Route::get('/export/bureau-changes-pdf', [ExportController::class, 'exportBureauChangesPdf']);
    Route::get('/export/bureau-changes-excel', [ExportController::class, 'exportBureauChangesExcel']);
    
    // ── Approbation des modifications Fixings ───────────────────
    Route::post('/fixings/{fixing}/approuver-modification', [FixingController::class, 'approuverModification']);
    Route::post('/fixings/{fixing}/rejeter-modification', [FixingController::class, 'rejeterModification']);
    
    // ── Approbation des modifications Bureaux de change ────────
    Route::post('/bureau-changes/{bureauChange}/approuver-modification', [BureauChangeController::class, 'approuverModification']);
    Route::post('/bureau-changes/{bureauChange}/rejeter-modification', [BureauChangeController::class, 'rejeterModification']);
    
    // ── Approbation des modifications Acteurs ──────────────────
    Route::post('/users/{user}/approuver-modification', [UserController::class, 'approuverModification']);
    Route::post('/users/{user}/rejeter-modification', [UserController::class, 'rejeterModification']);

    // ── Dashboard ──────────────────────────────────────────────
    Route::get('/dashboard', DashboardController::class);

    // ── Structure organisationnelle ────────────────────────────
    Route::apiResource('agences',      AgenceController::class);
    Route::apiResource('directions',   DirectionController::class);
    Route::apiResource('departements', DepartementController::class);
    Route::apiResource('services',     ServiceController::class);

    // ── Gestion acteurs ────────────────────────────────────────
    Route::get('/users/desactives',             [UserController::class, 'desactives']);
    Route::apiResource('users', UserController::class);
    Route::patch('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
    Route::post('/users/{user}/permissions',    [UserController::class, 'assignPermissions']);

    // ── Rôles & Permissions ────────────────────────────────────
    Route::apiResource('roles',       RoleController::class);
    Route::apiResource('permissions', PermissionController::class);

    // ── Fixings ────────────────────────────────────────────────
    Route::apiResource('fixings', FixingController::class);
    Route::post('/fixings/{fixing}/valider', [FixingController::class, 'valider']);
    Route::post('/fixings/{fixing}/rejeter', [FixingController::class, 'rejeter']);

    // ── Bureaux de change ──────────────────────────────────────
    // Les routes fixes (archives, import, restaurer, definitif) doivent
    // rester AVANT apiResource, sinon Laravel les prendrait pour un identifiant.
    Route::get('/bureau-changes/archives',          [BureauChangeController::class, 'archives']);
    Route::post('/bureau-changes/import',           [BureauChangeController::class, 'import']);
    Route::post('/bureau-changes/{id}/restaurer',   [BureauChangeController::class, 'restore']);
    Route::delete('/bureau-changes/{id}/definitif', [BureauChangeController::class, 'forceDelete']);
    Route::apiResource('bureau-changes', BureauChangeController::class);
    Route::post('/bureau-changes/{bureauChange}/valider', [BureauChangeController::class, 'valider']);
    Route::post('/bureau-changes/{bureauChange}/rejeter', [BureauChangeController::class, 'rejeter']);

    // ── Audit logs ─────────────────────────────────────────────
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
});