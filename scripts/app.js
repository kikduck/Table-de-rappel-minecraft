import { ImageToNumberMode } from './imageToNumber.js';
import { NumberToImageMode } from './numberToImage.js';

const API_URL = '/api/entries';

// Éléments DOM
const modeButtons = document.querySelectorAll('.mode-btn');
const gameModes = document.querySelectorAll('.game-mode');
const gameContainer = document.querySelector('.game-container');
const loadingMessage = document.createElement('p');
loadingMessage.textContent = 'Chargement des données du jeu...';
gameContainer.prepend(loadingMessage);

let currentModeInstance = null;
let rappelTableData = [];

async function initializeGame() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status} - ${response.statusText}`);
        }
        rappelTableData = await response.json();

        if (!rappelTableData || rappelTableData.length === 0) {
            throw new Error('Aucune donnée reçue de l\'API ou table vide.');
        }

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
                if (mode !== currentMode) {
                    currentMode = mode;
                    modeButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    gameModes.forEach(gameMode => {
                        gameMode.classList.remove('active');
                        if (gameMode.id === mode) {
                            gameMode.classList.add('active');
                        }
                    });

                    if (mode === 'image-to-number') {
                        currentModeInstance = imageToNumberMode;
                    } else {
                        currentModeInstance = numberToImageMode;
                    }
                    currentModeInstance.start();
                }
            });
        });

    } catch (error) {
        console.error("Erreur lors de l'initialisation du jeu:", error);
        loadingMessage.textContent = `Erreur de chargement des données : ${error.message}. Vérifiez que le serveur est lancé.`;
        loadingMessage.style.color = 'red';
    }
}

// Lancer l'initialisation du jeu
initializeGame(); 