const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Plus simple que body-parser
app.use(express.static(path.join(__dirname, '..')));

// Chemin vers le fichier JSON
const dataFilePath = path.join(__dirname, '../data/userTable.json');

// Fonction utilitaire pour lire/écrire le fichier JSON
const readDataFile = () => {
    try {
        if (!fs.existsSync(dataFilePath)) {
            return null;
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

// Route pour obtenir toutes les entrées
app.get('/api/entries', (req, res) => {
    const entries = readDataFile();

    if (!entries) {
        return res.status(404).json({ error: 'Fichier de données non trouvé' });
    }

    res.json(entries);
});

// Route pour ajouter ou mettre à jour une entrée
app.post('/api/entries', (req, res) => {
    try {
        const newEntry = req.body;

        // Vérification de base
        if (!newEntry || typeof newEntry.number !== 'number' || !newEntry.icon) {
            return res.status(400).json({ error: 'Données d\'entrée invalides' });
        }

        // Lire le fichier existant
        let entries = readDataFile() || [];

        // Vérifier si l'entrée existe déjà
        const existingIndex = entries.findIndex(entry => entry.number === newEntry.number);

        if (existingIndex !== -1) {
            // Mettre à jour l'entrée existante
            entries[existingIndex] = {
                ...entries[existingIndex],
                ...newEntry,
                isDefault: false // Marquer comme personnalisé
            };
        } else {
            // Ajouter une nouvelle entrée
            entries.push({
                ...newEntry,
                isDefault: false
            });
        }

        // Trier les entrées par numéro
        entries.sort((a, b) => a.number - b.number);

        // Écrire dans le fichier
        if (!writeDataFile(entries)) {
            return res.status(500).json({ error: 'Erreur lors de l\'écriture du fichier' });
        }

        res.json({ success: true, entries });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour supprimer une entrée
app.delete('/api/entries/:number', (req, res) => {
    try {
        const entryNumber = parseInt(req.params.number);

        if (isNaN(entryNumber)) {
            return res.status(400).json({ error: 'Numéro d\'entrée invalide' });
        }

        // Lire le fichier existant
        const entries = readDataFile();

        if (!entries) {
            return res.status(404).json({ error: 'Fichier de données non trouvé' });
        }

        // Trouver l'index de l'entrée à supprimer
        const entryIndex = entries.findIndex(entry => entry.number === entryNumber);

        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Entrée non trouvée' });
        }

        // Supprimer l'entrée
        entries.splice(entryIndex, 1);

        // Écrire dans le fichier
        if (!writeDataFile(entries)) {
            return res.status(500).json({ error: 'Erreur lors de l\'écriture du fichier' });
        }

        res.json({ success: true, entries });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`API disponible sur http://localhost:${PORT}/api/entries`);
}); 