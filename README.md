# Documentation de l'API

## Description

Ce projet est une API développée en utilisant Express.js, OpenAPI et Swagger UI pour gérer les utilisateurs et les salons.

## Installation

### Cloner le dépôt

```sh
git clone <URL_DU_DEPOT>
cd <nom_du_projet>
```

### Installer les dépendances

```sh
npm install
```

### Lancer le serveur

```sh
npm run dev
```

Par défaut, le serveur s'exécute sur [http://localhost:5000/](http://localhost:5000/).

## Documentation Swagger UI

Une documentation interactive OpenAPI est disponible après avoir démarré le serveur.

Accédez à Swagger UI en ouvrant l'URL suivante dans votre navigateur :

[http://localhost:5000/api-docs](http://localhost:5000/api-docs)

Vous pourrez y explorer les différentes routes de l'API et tester les requêtes directement.

## Swagger UI Configuration

Ajoutez Swagger UI à votre projet en installant les dépendances suivantes :

```sh
npm install swagger-jsdoc swagger-ui-express
```

## Endpoints

### Authentification

- `POST /register` - Inscription d'un nouvel utilisateur.
- `POST /login` - Connexion d'un utilisateur.

### Utilisateurs & Salons

- `GET /data` - Récupération des utilisateurs et salons (protégé, token requis).
- `POST /update-group` - Mise à jour des groupes utilisateurs.
- `POST /update-salons` - Mise à jour des salons.

## Composition de l'équipe

- **Pelagie** - Rôle
- **Bermond Ethan** - Rôle
- **Hugo** - Rôle



