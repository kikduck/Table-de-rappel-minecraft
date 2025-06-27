const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Plus simple que body-parser
app.use(express.static(path.join(__dirname, '../frontend')));

// Chemin vers le fichier JSON des tables
const dataFilePath = path.join(__dirname, '../frontend/data/userTables.json');

// Fonction utilitaire pour lire/écrire le fichier JSON
const readDataFile = () => {
    try {
        console.log(`Tentative de lecture du fichier: ${dataFilePath}`);

        if (!fs.existsSync(dataFilePath)) {
            console.log('Fichier n\'existe pas, création du fichier par défaut...');

            // Vérifier si le dossier parent existe
            const parentDir = path.dirname(dataFilePath);
            if (!fs.existsSync(parentDir)) {
                console.log(`Création du dossier parent: ${parentDir}`);
                fs.mkdirSync(parentDir, { recursive: true });
            }

            // Créer un fichier par défaut avec une table de base
            const defaultData = {
                tables: {
                    "default": {
                        id: "default",
                        name: "Table par défaut",
                        entries: []
                    }
                },
                currentTable: "default"
            };

            if (writeDataFile(defaultData)) {
                console.log('Fichier par défaut créé avec succès');
                return defaultData;
            } else {
                console.error('Échec de la création du fichier par défaut');
                return null;
            }
        }

        console.log('Lecture du fichier existant...');
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        console.log('Fichier lu avec succès');
        return data;
    } catch (error) {
        console.error('Erreur de lecture du fichier:', error);
        console.error('Détails de l\'erreur:', {
            code: error.code,
            path: error.path,
            message: error.message
        });
        return null;
    }
};

const writeDataFile = (data) => {
    try {
        console.log(`Tentative d'écriture dans le fichier: ${dataFilePath}`);

        // Vérifier si le dossier parent existe
        const parentDir = path.dirname(dataFilePath);
        if (!fs.existsSync(parentDir)) {
            console.log(`Création du dossier parent: ${parentDir}`);
            fs.mkdirSync(parentDir, { recursive: true });
        }

        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Fichier écrit avec succès');
        return true;
    } catch (error) {
        console.error('Erreur d\'écriture du fichier:', error);
        console.error('Détails de l\'erreur:', {
            code: error.code,
            path: error.path,
            message: error.message,
            permissions: fs.constants
        });

        // Vérifications supplémentaires
        try {
            const stats = fs.statSync(path.dirname(dataFilePath));
            console.log('Permissions du dossier parent:', stats.mode.toString(8));
        } catch (statError) {
            console.error('Erreur lors de la vérification des permissions:', statError);
        }

        return false;
    }
};

// Route pour obtenir la liste des tables
app.get('/api/tables', (req, res) => {
    const data = readDataFile();
    if (!data) {
        return res.status(500).json({ error: 'Erreur de lecture des données' });
    }

    const tablesList = Object.values(data.tables).map(table => ({
        id: table.id,
        name: table.name,
        entryCount: table.entries.length
    }));

    res.json({
        tables: tablesList,
        currentTable: data.currentTable
    });
});

// Route pour créer une nouvelle table
app.post('/api/tables', (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Nom de table invalide' });
        }

        const data = readDataFile();
        if (!data) {
            return res.status(500).json({ error: 'Erreur de lecture des données' });
        }

        const tableId = Date.now().toString();
        const tableName = name.trim();

        // Vérifier si le nom existe déjà
        const existingTable = Object.values(data.tables).find(table => table.name === tableName);
        if (existingTable) {
            return res.status(400).json({ error: 'Une table avec ce nom existe déjà' });
        }

        data.tables[tableId] = {
            id: tableId,
            name: tableName,
            entries: []
        };

        if (!writeDataFile(data)) {
            return res.status(500).json({ error: 'Erreur lors de l\'écriture du fichier' });
        }

        res.json({ success: true, table: data.tables[tableId] });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour supprimer une table
app.delete('/api/tables/:tableId', (req, res) => {
    try {
        const { tableId } = req.params;

        const data = readDataFile();
        if (!data) {
            return res.status(500).json({ error: 'Erreur de lecture des données' });
        }

        // Interdire la suppression de la table par défaut
        if (tableId === 'default') {
            return res.status(400).json({ error: 'Impossible de supprimer la table par défaut' });
        }

        if (!data.tables[tableId]) {
            return res.status(404).json({ error: 'Table non trouvée' });
        }

        delete data.tables[tableId];

        // Si la table supprimée était la table courante, basculer vers la table par défaut
        if (data.currentTable === tableId) {
            data.currentTable = 'default';
        }

        if (!writeDataFile(data)) {
            return res.status(500).json({ error: 'Erreur lors de l\'écriture du fichier' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour changer la table courante
app.put('/api/tables/current/:tableId', (req, res) => {
    try {
        const { tableId } = req.params;

        const data = readDataFile();
        if (!data) {
            return res.status(500).json({ error: 'Erreur de lecture des données' });
        }

        if (!data.tables[tableId]) {
            return res.status(404).json({ error: 'Table non trouvée' });
        }

        data.currentTable = tableId;

        if (!writeDataFile(data)) {
            return res.status(500).json({ error: 'Erreur lors de l\'écriture du fichier' });
        }

        res.json({ success: true, currentTable: tableId });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour obtenir les entrées de la table courante
app.get('/api/entries', (req, res) => {
    const data = readDataFile();
    if (!data) {
        return res.status(500).json({ error: 'Erreur de lecture des données' });
    }

    const currentTable = data.tables[data.currentTable];
    if (!currentTable) {
        return res.status(404).json({ error: 'Table courante non trouvée' });
    }

    res.json(currentTable.entries);
});

// Route pour obtenir les entrées d'une table spécifique
app.get('/api/entries/:tableId', (req, res) => {
    const { tableId } = req.params;
    const data = readDataFile();

    if (!data) {
        return res.status(500).json({ error: 'Erreur de lecture des données' });
    }

    const table = data.tables[tableId];
    if (!table) {
        return res.status(404).json({ error: 'Table non trouvée' });
    }

    res.json(table.entries);
});

// Route pour ajouter ou mettre à jour une entrée dans une table spécifique
app.post('/api/entries/:tableId', (req, res) => {
    try {
        const { tableId } = req.params;
        const newEntry = req.body;

        console.log(`POST /api/entries/${tableId} - Nouvelle entrée:`, newEntry);

        if (!newEntry || typeof newEntry.number !== 'number' || !newEntry.icon) {
            console.error('Données d\'entrée invalides:', { newEntry, typeOfNumber: typeof newEntry.number });
            return res.status(400).json({ error: 'Données d\'entrée invalides' });
        }

        console.log('Lecture des données...');
        const data = readDataFile();
        if (!data) {
            console.error('Échec de lecture des données');
            return res.status(500).json({ error: 'Erreur de lecture des données' });
        }

        console.log(`Recherche de la table ${tableId}...`);
        const table = data.tables[tableId];
        if (!table) {
            console.error('Table non trouvée:', tableId);
            console.log('Tables disponibles:', Object.keys(data.tables));
            return res.status(404).json({ error: 'Table non trouvée' });
        }

        const existingIndex = table.entries.findIndex(entry => entry.number === newEntry.number);

        if (existingIndex !== -1) {
            table.entries[existingIndex] = {
                ...table.entries[existingIndex],
                ...newEntry,
                isDefault: false
            };
        } else {
            table.entries.push({
                ...newEntry,
                isDefault: false
            });
        }

        table.entries.sort((a, b) => a.number - b.number);

        console.log('Tentative d\'écriture des données...');
        if (!writeDataFile(data)) {
            console.error('Échec de l\'écriture du fichier');
            return res.status(500).json({ error: 'Erreur lors de l\'écriture du fichier' });
        }

        console.log('Entrée ajoutée avec succès');
        res.json({ success: true, entries: table.entries });
    } catch (error) {
        console.error('Erreur dans POST /api/entries/:tableId:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour supprimer une entrée d'une table spécifique
app.delete('/api/entries/:tableId/:number', (req, res) => {
    try {
        const { tableId } = req.params;
        const entryNumber = parseInt(req.params.number);

        if (isNaN(entryNumber)) {
            return res.status(400).json({ error: 'Numéro d\'entrée invalide' });
        }

        const data = readDataFile();
        if (!data) {
            return res.status(500).json({ error: 'Erreur de lecture des données' });
        }

        const table = data.tables[tableId];
        if (!table) {
            return res.status(404).json({ error: 'Table non trouvée' });
        }

        const entryIndex = table.entries.findIndex(entry => entry.number === entryNumber);

        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Entrée non trouvée' });
        }

        table.entries.splice(entryIndex, 1);

        if (!writeDataFile(data)) {
            return res.status(500).json({ error: 'Erreur lors de l\'écriture du fichier' });
        }

        res.json({ success: true, entries: table.entries });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`API disponible sur http://localhost:${PORT}/api/entries`);
}); 