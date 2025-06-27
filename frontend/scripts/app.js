import { ImageToNumberMode } from './imageToNumber.js';
import { NumberToImageMode } from './numberToImage.js';

// Configuration de l'API
// Détection automatique de l'URL de l'API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/entries'  // En développement local
    : `${window.location.origin}/api/entries`; // Sur le serveur

const API_TABLES_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/tables'  // En développement local
    : `${window.location.origin}/api/tables`; // Sur le serveur

// Éléments DOM
const modeButtons = document.querySelectorAll('.mode-btn');
const gameModes = document.querySelectorAll('.game-mode');
const gameContainer = document.querySelector('.game-container');
const tableSelect = document.getElementById('table-select');
const tableEntryCount = document.getElementById('table-entry-count');
const loadingMessage = document.createElement('p');
loadingMessage.textContent = 'Chargement des données du jeu...';
gameContainer.prepend(loadingMessage);

let currentModeInstance = null;
let rappelTableData = [];
let tablesData = [];
let currentTableId = null;

async function initializeGame() {
    try {
        // Charger la liste des tables
        await loadTables();

        // Charger les entrées de la table courante
        await loadCurrentTableEntries();

        loadingMessage.remove();

        // Initialisation des modes avec les données chargées
        const imageToNumberMode = new ImageToNumberMode(rappelTableData);
        const numberToImageMode = new NumberToImageMode(rappelTableData);

        let currentMode = 'image-to-number';
        currentModeInstance = imageToNumberMode;
        currentModeInstance.start();

        // Gestionnaires d'événements pour les boutons de mode
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                if (currentMode !== mode) {
                    // Arrêter le mode actuel
                    if (currentModeInstance) {
                        currentModeInstance.stop();
                    }

                    // Activer le nouveau mode
                    modeButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    gameModes.forEach(gameMode => gameMode.classList.remove('active'));
                    document.getElementById(mode).classList.add('active');

                    // Démarrer le nouveau mode
                    if (mode === 'image-to-number') {
                        currentModeInstance = new ImageToNumberMode(rappelTableData);
                    } else {
                        currentModeInstance = new NumberToImageMode(rappelTableData);
                    }

                    currentModeInstance.start();
                    currentMode = mode;
                }
            });
        });

        // Gestionnaire pour le changement de table
        tableSelect.addEventListener('change', async (e) => {
            const selectedTableId = e.target.value;
            if (selectedTableId && selectedTableId !== currentTableId) {
                await changeCurrentTable(selectedTableId);
            }
        });

    } catch (error) {
        console.error("Erreur lors de l'initialisation du jeu:", error);
        loadingMessage.textContent = `Erreur de chargement: ${error.message}`;
    }
}

async function loadTables() {
    try {
        const response = await fetch(API_TABLES_URL);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        tablesData = data.tables;
        currentTableId = data.currentTable;

        // Remplir le sélecteur de tables
        updateTableSelector();

    } catch (error) {
        console.error("Erreur lors du chargement des tables:", error);
        throw error;
    }
}

async function loadCurrentTableEntries() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status} - ${response.statusText}`);
        }

        rappelTableData = await response.json();

        if (!rappelTableData || rappelTableData.length === 0) {
            console.log('Aucune donnée dans la table courante.');
            rappelTableData = [];
        }

        updateTableInfo();

    } catch (error) {
        console.error("Erreur lors du chargement des entrées:", error);
        throw error;
    }
}

async function changeCurrentTable(tableId) {
    try {
        // Changer la table courante sur le serveur
        const response = await fetch(`${API_TABLES_URL}/current/${tableId}`, {
            method: 'PUT',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erreur de communication' }));
            throw new Error(`Erreur lors du changement de table : ${response.status} - ${errorData.error || response.statusText}`);
        }

        const result = await response.json();
        console.log('Changement de table réussi:', result);

        currentTableId = tableId;

        // Recharger les entrées de la nouvelle table
        await loadCurrentTableEntries();

        // Redémarrer le mode de jeu avec les nouvelles données
        if (currentModeInstance) {
            currentModeInstance.stop();

            if (document.querySelector('.mode-btn.active').dataset.mode === 'image-to-number') {
                currentModeInstance = new ImageToNumberMode(rappelTableData);
            } else {
                currentModeInstance = new NumberToImageMode(rappelTableData);
            }

            currentModeInstance.start();
        }

        console.log('Table changée avec succès vers:', tableId);

    } catch (error) {
        console.error("Erreur lors du changement de table:", error);

        // Recharger la liste des tables pour s'assurer de la cohérence
        try {
            await loadTables();
        } catch (reloadError) {
            console.error("Erreur lors du rechargement des tables:", reloadError);
        }

        alert(`Erreur lors du changement de table: ${error.message}`);
    }
}

function updateTableSelector() {
    tableSelect.innerHTML = '';

    if (tablesData.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Aucune table disponible';
        tableSelect.appendChild(option);
        return;
    }

    tablesData.forEach(table => {
        const option = document.createElement('option');
        option.value = table.id;
        option.textContent = table.name;
        if (table.id === currentTableId) {
            option.selected = true;
        }
        tableSelect.appendChild(option);
    });
}

function updateTableInfo() {
    const entryCount = rappelTableData.length;
    const currentTable = tablesData.find(table => table.id === currentTableId);
    const tableName = currentTable ? currentTable.name : 'Table inconnue';

    tableEntryCount.textContent = `${entryCount} entrée${entryCount !== 1 ? 's' : ''}`;
}

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
}); 