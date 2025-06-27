# Table de Rappel Minecraft

Une application pour mémoriser vos recettes et associations numériques dans Minecraft.

## Nouvelles Fonctionnalités - Gestion de Tables Multiples

### 🎯 Fonctionnalités Principales

- **Plusieurs tables de rappel** : Créez et gérez autant de tables que vous voulez
- **Sélection de table active** : Choisissez quelle table utiliser pour vos sessions d'entraînement
- **Gestion complète** : Créez, modifiez et supprimez vos tables personnalisées
- **Interface améliorée** : Design moderne et intuitif

### 🚀 Utilisation

#### 1. Page Principale (index.html)
- **Sélecteur de table** : Choisissez votre table de rappel active
- **Modes de jeu** : Image vers Nombre ou Nombre vers Image
- **Changement de table** : Basculez entre vos tables en temps réel

#### 2. Gestion des Tables (table.html)
- **Création de table** : Donnez un nom à votre nouvelle table
- **Liste des tables** : Visualisez toutes vos tables avec leur nombre d'entrées
- **Actions sur les tables** :
  - 🎮 **Utiliser cette table** : Définir comme table active
  - ⚙️ **Gérer les entrées** : Ajouter/modifier/supprimer des entrées
  - 🗑️ **Supprimer** : Supprimer une table (sauf la table par défaut)

#### 3. Gestion des Entrées
- **Recherche d'objets** : Trouvez facilement l'objet Minecraft souhaité
- **Aperçu en temps réel** : Voyez l'icône avant de l'ajouter
- **Association numérique** : Associez chaque objet à un nombre (0-99)
- **Modification/Suppression** : Gérez vos entrées existantes

### 🛠️ Installation et Démarrage

1. **Démarrer le serveur** :
   ```bash
   node backend/server.js
   ```

2. **Ouvrir l'application** :
   - Navigateur : `http://localhost:3000`
   - Fichier local : Ouvrir `index.html`

3. **Créer votre première table** :
   - Allez dans "Gérer les Tables"
   - Créez une nouvelle table avec un nom personnalisé
   - Ajoutez vos entrées préférées

### 📁 Structure des Données

Les données sont stockées dans `data/userTables.json` :
```json
{
  "tables": {
    "default": {
      "id": "default",
      "name": "Table par défaut",
      "entries": [...]
    },
    "votre_table": {
      "id": "timestamp",
      "name": "Ma Table Personnalisée",
      "entries": [...]
    }
  },
  "currentTable": "default"
}
```

### 🎮 Modes de Jeu

1. **Image vers Nombre** : Voir une icône et deviner le nombre associé
2. **Nombre vers Image** : Voir un nombre et choisir la bonne icône

### 🔧 Fonctionnalités Techniques

- **API REST** : Gestion des tables via API
- **Sauvegarde automatique** : Toutes les modifications sont sauvegardées
- **Interface responsive** : Fonctionne sur mobile et desktop
- **Capacitor Ready** : Compatible avec l'application mobile

### 🎨 Personnalisation

- **Tables thématiques** : Créez des tables par thème (outils, armes, blocs, etc.)
- **Niveaux de difficulté** : Tables pour débutants, intermédiaires, experts
- **Collections spéciales** : Objets rares, nouveaux items, etc.

### 🔄 Migration des Données

Vos anciennes données ont été automatiquement migrées vers le nouveau format lors de la première utilisation.

---

*Amusez-vous bien avec votre nouvelle table de rappel Minecraft multi-tables !* 🎮 