<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nom', 'email', 'password', 'adresse',
        'service_id', 'role_id',
        'is_active', 'must_change_password',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password'            => 'hashed',
            'is_active'           => 'boolean',
            'must_change_password'=> 'boolean',
        ];

    }

    // ── Relations de base ──────────────────────────────────────

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /** Permissions individuelles attribuées manuellement */
    public function permissionsDirectes(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_user');
    }

    public function permissionsRetirees(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_user_denied');
    }

    public function fixingsCrees(): HasMany
    {
        return $this->hasMany(Fixing::class, 'created_by');
    }

    public function fixingsValides(): HasMany
    {
        return $this->hasMany(Fixing::class, 'validated_by');
    }

    public function bureauxChangesCrees(): HasMany
    {
        return $this->hasMany(BureauChange::class, 'created_by');
    }

    public function bureauxChangesValides(): HasMany
    {
        return $this->hasMany(BureauChange::class, 'validated_by');
    }

    // ── Navigation hiérarchique automatique ───────────────────

    public function getDepartementAttribute()
    {
        return $this->service?->departement;
    }

    public function getDirectionAttribute()
    {
        return $this->service?->departement?->direction;
    }

    public function getAgenceAttribute()
    {
        return $this->service?->departement?->direction?->agence;
    }

    // ── Logique des permissions (le cœur du système) ──────────

    /**
     * Toutes les permissions effectives de cet acteur :
     * (permissions du rôle ∪ permissions directes) − permissions retirées
     *
     * Les exceptions sont propres à l'acteur et ne touchent jamais le rôle.
     */
    public function toutesLesPermissions()
    {
        $permissionsRole = $this->role
            ? $this->role->permissions->pluck('libelle')
            : collect();

        $permissionsDirectes = $this->permissionsDirectes->pluck('libelle');
        $permissionsRetirees = $this->permissionsRetirees->pluck('libelle');

        return $permissionsRole
            ->merge($permissionsDirectes)
            ->unique()
            ->diff($permissionsRetirees)
            ->values();
    }

    /**
     * Vérification simple : $user->hasPermission('creer_fixing')
     */
    public function hasPermission(string $libelle): bool
    {
        return $this->toutesLesPermissions()->contains($libelle);
    }

    // ── Helpers état du compte ─────────────────────────────────

    public function isActive(): bool
    {
        return $this->is_active === true;
    }

    public function mustChangePassword(): bool
    {
        return $this->must_change_password === true;
    }
}
