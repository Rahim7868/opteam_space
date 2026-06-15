# OPTEAM_SPACE

Application de gestion des fixings de change pour bureaux de change.

## Stack

- Backend: Laravel 12 API REST, Sanctum, MySQL
- Frontend: React + Vite, React Router, Axios, Tailwind CSS
- Tests backend: PHPUnit

## Installation backend

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Configurer MySQL dans `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=opteam_space
DB_USERNAME=root
DB_PASSWORD=
```

Créer la base `opteam_space`, puis lancer:

```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

Comptes de test:

- Admin: `admin@opteam.test` / `password`
- Agent: `amina.agent@opteam.test` / `password`
- Agent: `youssef.agent@opteam.test` / `password`

## Installation frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Le frontend consomme par defaut `http://127.0.0.1:8000/api`.

## Verification

```bash
cd backend
php artisan test

cd ../frontend
npm run build
```

## Fonctionnalites

- Authentification token Sanctum: login, logout, profil courant
- Roles Admin et Agent avec routes protegees
- CRUD bureaux de change et agents
- Creation, filtrage, consultation, approbation et refus des fixings
- Demandes de modification de fixing avec workflow admin
- Tableau de bord par role
- Historique des actions importantes
- Validation backend via Form Requests
- Autorisations via Policies et middleware de role
