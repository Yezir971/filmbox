# 🎬 FilmBox — Plateforme Cinéphile & Base de Données Haute Performance

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16--alpine-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Hub-2496ED?style=for-the-badge&logo=docker)](https://hub.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**FilmBox** est une application web moderne pour cinéphiles alliant une interface soignée (thème salle obscure, animations fluides, exploration visuelle) et une architecture de base de données PostgreSQL avancée et sécurisée.

Le projet met en œuvre des fonctionnalités SQL complexes : requêtes sargables, indexation GIN Trigramme, fonctions et procédures stockées PL/pgSQL, verrous pessimistes (`FOR UPDATE`), transactions ACID, gestion fine des privilèges (principe du moindre privilège) et Row-Level Security (RLS).
L'ensemble des réponses de tous les tp se trouvent dans le fichier : [`exo_j1.sql`](./database/exo_j1.sql)

---

## 📑 Sommaire

1. [Démarrage Rapide avec Docker Hub](#-démarrage-rapide-avec-docker-hub)
2. [Architecture & Stack Technique](#-architecture--stack-technique)
3. [Optimisations des Performances (Rapport M12)](#-optimisations-des-performances-rapport-m12)
4. [Fonctionnalités SQL Avancées](#-fonctionnalités-sql-avancées)
5. [Sécurité & Permissions](#-sécurité--permissions)
6. [Remarques & Spécificités du TP](#-remarques--spécificités-du-tp)
7. [Commandes Utiles](#-commandes-utiles)

---

## 🚀 Démarrage Rapide avec Docker Hub

Pour exécuter le projet localement avec exactement le même environnement préconfiguré, vous pouvez utiliser l'image officielle publiée sur **Docker Hub**.

### 1. Prérequis
- [Docker Engine](https://docs.docker.com/engine/install/) et [Docker Compose](https://docs.docker.com/compose/) installés sur votre machine.

### 2. Récupérer les fichiers de configuration
Clonez le dépôt ou récupérez simplement le fichier `docker-compose.yml` :
```bash
git clone https://github.com/Yezir971/filmbox.git
cd filmbox
```

### 3. Fichier `docker-compose.yml`
Assurez-vous que votre `docker-compose.yml` référence l'image Docker Hub :
```yaml
version: '3.8'

services:
  app:
    image: yezir9710/filmbox-app:latest
    container_name: filmbox-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://filmbox_app:StarFox3d@postgres:5432/filmbox
      PGHOST: postgres
      PGPORT: 5432
      PGUSER: filmbox_app
      PGPASSWORD: StarFox3d
      PGDATABASE: filmbox
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - filmbox-network

  postgres:
    image: yezir9710/filmbox-db:latest
    container_name: filmbox-pg-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: yoda
      POSTGRES_PASSWORD: StarFox3d
      POSTGRES_DB: filmbox
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U yoda -d filmbox"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - filmbox-network

volumes:
  pgdata:

networks:
  filmbox-network:
    driver: bridge
```

### 4. Lancer l'application
Exécutez la commande suivante à la racine :
```bash
docker compose pull
docker compose up -d
```

L'application est immédiatement accessible sur **[http://localhost:3000](http://localhost:3000)** !

---

## 🏗 Architecture & Stack Technique

- **Front-end / SSR** : Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Back-end API** : Next.js API Routes (`/api/films`, `/api/films/search`, `/api/rankings`, `/api/journal`, `/api/stats`, etc.).
- **Base de Données** : PostgreSQL 16 (sur image Alpine légère).
- **Communication DB** : Client de pool optimisé `pg` (`node-postgres`) avec gestion de transactions ACID.
- **Conteneurisation** : Multi-stage build Docker (Alpine, Standalone output Next.js ~120 Mo).

---

## ⚡ Optimisations des Performances (Rapport M12)

Les requêtes de l'application ont fait l'objet d'un audit approfondi de plan d'exécution (`EXPLAIN ANALYZE BUFFERS`) documenté dans le fichier [`rapport.md`](./rapport.md) :

### 1. M12.1 — Historique des visionnages par membre
* **Index créé** : B-Tree composite `idx_journal_utilisateur_date ON journal (utilisateur_id, date_visionnage DESC)`.
* **Diagnostic avant** : PostgreSQL déployait deux workers pour un `Parallel Seq Scan` lourd rejetant plus de 333 000 lignes, suivi d'un tri `quicksort` en mémoire pour appliquer la pagination.
* **Résultat** : Suppression totale du balayage séquentiel et bascule sur un `Index Scan` direct. Temps d'exécution réduit de **~147,5 ms** à un accès quasi-instantané (**< 2 ms**).
* *Consultez le détail complet des mesures dans [`rapport.md`](./rapport.md).*

### 2. M12.2 — Tendances mensuelles et condition sargable
* **Index créé** : `idx_journal_date_film ON journal (date_visionnage, film_id)`.
* **Diagnostic avant** : L'utilisation de `TO_CHAR(date_visionnage, 'YYYY-MM')` empêchait le planificateur d'utiliser l'index, forçant un balayage complet (jusqu'à 259,6 ms).
* **Résultat** : Réécriture en condition sargable (`date_visionnage >= '2026-08-01' AND date_visionnage < '2026-09-01'`) combinée à l'index couvrant. Bascule en `Index Only Scan` avec une latence réduite à **~21 ms**.

### 3. M12.3 — Recherche textuelle avec Jokers
* **Index créé** : Extension `pg_trgm` et index GIN trigramme `idx_films_titre_trgm ON films USING GIN (titre gin_trgm_ops)`.
* **Diagnostic avant** : La clause `ILIKE '%mot_cle%'` parcourait et rejetait 95 030 titres séquentiellement (temps d'exécution : ~98,8 ms).
* **Résultat** : Bascule sur un `Bitmap Index Scan`. Le temps d'exécution s'effondre à **~10,7 ms** (division de la latence par 9).

---

## 🛠 Fonctionnalités SQL Avancées

| Exercice | Fonctionnalité | Rôle & Description |
| :--- | :--- | :--- |
| **M10.1** | `duree_texte(minutes)` | Formate les durées en clair (ex: `148` $\rightarrow$ `2 h 28`). |
| **M10.2** | `note_ponderee(film_id)` | Calcul de moyenne bayésienne avec mise en cache dynamique (`filmbox.note_globale`). |
| **M10.3** | `compatibilite(pseudo_a, pseudo_b)` | Calcul de score cinéphile comparant les écarts de notes entre deux membres. |
| **M13.1** | `noter(pseudo, titre, note)` | Procédure PL/pgSQL d'upsert atomique d'évaluation avec vérification des paliers (0.5 à 5). |
| **M14.1** | `trg_maj_stats` | Trigger recalculant automatiquement la moyenne et le nombre de notes sur modification. |
| **M14.2** | `auditer_note` | Trigger insérant l'historique des modifications de notes dans la table `audit_notes`. |
| **M15.2** | Verrouillage Pessimiste | Incrémentation atomique du nombre de vues d'un film avec `SELECT ... FOR UPDATE` et `UPDATE ... RETURNING nb_vues`. |
| **M15.3** | Atomicité des Lots | Insertion multi-films dans `journal` avec `BEGIN / COMMIT / ROLLBACK` garantissant qu'aucune ligne partielle n'est conservée en cas d'erreur. |
| **M16.3** | `rechercher_films(texte)` | Fonction SQL STABLE de recherche instantanée par mot-clé intégrée à la barre de recherche globale (`Ctrl+K`). |

---

## 🔒 Sécurité & Permissions

### Rôle applicatif `filmbox_app` (Exercice 16.1)
Pour respecter le **principe du moindre privilège**, l'application ne se connecte pas avec le super-utilisateur `yoda`, mais avec un rôle dédié `filmbox_app` :
- **Lecture (`SELECT`)** : Accordée sur l'ensemble des tables et vues nécessaires au front-end (`films`, `notes`, `journal`, `utilisateurs`, `casting`, `liste`, `v_fiche_film`, etc.).
- **Écriture (`INSERT`, `UPDATE`)** : Restreinte strictement aux tables `notes` et `journal`.
- **Suppression (`DELETE`)** : Totalement interdite (`REVOKE ALL`).
- **Structure / Schéma (`ALTER`, `DROP`)** : Totalement interdite.

### Sécurité par Ligne (Row-Level Security - Exercice 16.2)
La table `journal` est protégée par la RLS :
- Un membre connecté (`app.membre_id`) ne voit que les entrées publiques (`prive = false`) et ses propres entrées privées.
- Les entrées privées des tiers lui sont invisibles.
- L'insertion et la modification ne sont autorisées que pour les lignes dont l'identifiant correspond à la session active.

---

## ⚠️ Remarques & Spécificités du TP

> [!NOTE]
> ### Note sur la section Découverte (Ajout aux favoris / Swipe)
> Sur la page **Découverte** (`/decouverte`), le bouton d'ajout d'un film aux favoris déclenche une tentative d'insertion dans la table `journal`.
> 
> **Il est tout à fait normal que cette action échoue ou soit bloquée dans cette version :**  
> Conformément aux consignes pédagogiques du TP (Exercice 16.1 & 16.2), les droits d'écriture sur la table `journal` sont strictement restreints pour le compte `filmbox_app` et conditionnés au paramétrage de session utilisateur de la Row-Level Security (`app.membre_id`). L'utilisateur invité n'a donc pas l'autorisation d'écrire anonymement dans le journal.

---

## 🧰 Commandes Utiles

### Vérifier l'état des conteneurs
```bash
docker compose ps
```

### Consulter les logs de l'application
```bash
docker compose logs -f app
```

### Se connecter à la base PostgreSQL en CLI
```bash
# Avec le rôle applicatif filmbox_app
docker exec -it filmbox-pg-db psql -U filmbox_app -d filmbox

# Avec le propriétaire yoda
docker exec -it filmbox-pg-db psql -U yoda -d filmbox
```

### Tester la recherche rapide SQL en direct
```bash
docker exec -it filmbox-pg-db psql -U filmbox_app -d filmbox -c "SELECT id, titre, annee, genre FROM rechercher_films('Inception');"
```

---

*Développé dans le cadre du module SQL Renforcé (M1).*


