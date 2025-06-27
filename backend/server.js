const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS plus permissive pour le serveur Ubuntu
const corsOptions = {
    origin: function (origin, callback) {
        // Permettre les requêtes sans origin (comme les apps mobiles ou Postman)
        if (!origin) return callback(null, true);
        // Permettre toutes les origines en développement
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        // En production, vous pouvez spécifier vos domaines autorisés
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Augmenter la taille limite pour les gros payloads
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware de logging pour diagnostiquer les problèmes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
        origin: req.get('Origin'),
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    next();
});

// Chemin vers le fichier JSON des tables
const dataFilePath = path.join(__dirname, '../frontend/data/userTables.json');

// Fonction utilitaire pour lire/écrire le fichier JSON
const readDataFile = () => {
    try {
        if (!fs.existsSync(dataFilePath)) {
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
            writeDataFile(defaultData);
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    } catch (error) {
        console.error('Erreur de lecture du fichier:', error);
        return null;
    }
};

const writeDataFile = (data) => {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Erreur d\'écriture du fichier:', error);
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

        if (!newEntry || typeof newEntry.number !== 'number' || !newEntry.icon) {
            return res.status(400).json({ error: 'Données d\'entrée invalides' });
        }

        const data = readDataFile();
        if (!data) {
            return res.status(500).json({ error: 'Erreur de lecture des données' });
        }

        const table = data.tables[tableId];
        if (!table) {
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

        if (!writeDataFile(data)) {
            return res.status(500).json({ error: 'Erreur lors de l\'écriture du fichier' });
        }

        res.json({ success: true, entries: table.entries });
    } catch (error) {
        console.error('Erreur:', error);
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