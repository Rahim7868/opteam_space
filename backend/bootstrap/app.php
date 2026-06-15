<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\ForceJsonResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureRole::class,
        ]); 

        // Forcer le format JSON pour toutes les requêtes API
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        // Ajouter le middleware CORS pour autoriser les requêtes du frontend React
        $middleware->prepend(HandleCors::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
