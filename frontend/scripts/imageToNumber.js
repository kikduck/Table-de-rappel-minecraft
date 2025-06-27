import { getRandomItem } from './common.js';

export class ImageToNumberMode {
    constructor(tableData) {
        this.rappelTable = tableData;
        this.score = 0;
        this.currentItem = null;

        // Éléments DOM
        this.itemDisplay = document.querySelector('#image-to-number .item-display i');
        this.numberInput = document.getElementById('number-input');
        this.checkButton = document.getElementById('check-answer');
        this.scoreDisplay = document.getElementById('score-image-to-number');
        this.itemResult = document.getElementById('item-result');

        // Bind des événements
        this.boundCheckAnswer = () => this.checkAnswer();
        this.boundKeypress = (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        };
    }

    start() {
        this.score = 0;
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = this.score;
        }

        // Ajouter les événements
        if (this.checkButton) {
            this.checkButton.addEventListener('click', this.boundCheckAnswer);
        }
        if (this.numberInput) {
            this.numberInput.addEventListener('keypress', this.boundKeypress);
        }

        this.updateDisplay();
    }

    stop() {
        // Nettoyer les événements
        if (this.checkButton) {
            this.checkButton.removeEventListener('click', this.boundCheckAnswer);
        }
        if (this.numberInput) {
            this.numberInput.removeEventListener('keypress', this.boundKeypress);
        }
    }

    updateDisplay() {
        if (!this.rappelTable || this.rappelTable.length === 0) {
            console.error("Aucune donnée dans la table de rappel pour le mode ImageVersNombre.");
            if (this.itemDisplay) this.itemDisplay.className = 'icon-minecraft icon-minecraft-barrier';
            if (this.itemResult) {
                this.itemResult.textContent = 'Erreur: Données de jeu non disponibles.';
                this.itemResult.style.color = 'red';
            }
            return;
        }
        const item = getRandomItem(this.rappelTable);
        this.currentItem = item;
        if (this.itemDisplay) {
            this.itemDisplay.className = `icon-minecraft icon-minecraft-${item.icon}`;
        }
        if (this.numberInput) {
            this.numberInput.value = '';
        }
        if (this.itemResult) {
            this.itemResult.textContent = '';
        }
    }

    checkAnswer() {
        if (!this.currentItem || this.numberInput === null || this.itemResult === null || this.scoreDisplay === null) return;

        const userAnswer = parseInt(this.numberInput.value);
        const correctAnswer = parseInt(this.currentItem.key);

        if (userAnswer === correctAnswer) {
            this.score++;
            this.scoreDisplay.textContent = this.score;
            this.itemResult.textContent = 'Correct !';
            this.itemResult.style.color = '#4CAF50';
            setTimeout(() => this.updateDisplay(), 1000);
        } else {
            this.itemResult.textContent = 'Incorrect !';
            this.itemResult.style.color = '#f44336';
        }
    }
} 