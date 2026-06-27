<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\AgenceController;
use App\Http\Controllers\DirectionController;
use App\Http\Controllers\DepartementController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\FixingController;
use App\Http\Controllers\BureauChangeController;
use Illuminate\Support\Facades\Route;

// ── Auth publique ──────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);

// ── Auth protégée ─────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Première connexion uniquement
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // ── Structure organisationnelle ────────────────────────────
    Route::apiResource('agences',      AgenceController::class);
    Route::apiResource('directions',   DirectionController::class);
    Route::apiResource('departements', DepartementController::class);
    Route::apiResource('services',     ServiceController::class);

    // ── Gestion acteurs ────────────────────────────────────────
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
    Route::apiResource('bureau-changes', BureauChangeController::class);
    Route::post('/bureau-changes/{bureauChange}/valider', [BureauChangeController::class, 'valider']);
    Route::post('/bureau-changes/{bureauChange}/rejeter', [BureauChangeController::class, 'rejeter']);
});