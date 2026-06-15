<?php

use App\Http\Controllers\AgentController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BureauChangeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FixingController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', DashboardController::class);

    Route::apiResource('bureau-changes', BureauChangeController::class);
    Route::apiResource('agents', AgentController::class)->parameters(['agents' => 'agent']);

    Route::apiResource('fixings', FixingController::class);
    Route::post('/fixings/{fixing}/approve', [FixingController::class, 'approve'])->middleware('role:admin');
    Route::post('/fixings/{fixing}/reject', [FixingController::class, 'reject'])->middleware('role:admin');
   

    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('role:admin');
});
