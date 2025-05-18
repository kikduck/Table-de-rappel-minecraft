import { getRandomItem, getRandomOptions, shuffleArray } from './common.js';

export class NumberToImageMode {
    constructor(tableData) {
        this.rappelTable = tableData;
        this.score = 0;
        this.currentItem = null;

        // Éléments DOM
        this.numberDisplay = document.querySelector('#number-to-image .number-display');
        this.optionsContainer = document.querySelector('#number-to-image .options-container');
        this.scoreDisplay = document.querySelector('#number-to-image .score-display #score');
        this.itemResult = document.getElementById('item-result');
    }

    start() {
        this.score = 0;
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = this.score;
        }
        this.updateDisplay();
    }

    updateDisplay() {
        if (!this.rappelTable || this.rappelTable.length === 0) {
            console.error("Aucune donnée dans la table de rappel pour le mode NombreVersImage.");
            if (this.numberDisplay) this.numberDisplay.textContent = '?';
            if (this.optionsContainer) this.optionsContainer.innerHTML = '<p style="color:red;">Erreur: Données non disponibles.</p>';
            if (this.itemResult) {
                this.itemResult.textContent = 'Erreur: Données de jeu non disponibles.';
                this.itemResult.style.color = 'red';
            }
            return;
        }
        // Obtenir un item aléatoire
        const item = getRandomItem(this.rappelTable);
        this.currentItem = item;

        // Afficher le numéro
        if (this.numberDisplay) {
            this.numberDisplay.textContent = item.key;
        }

        // Obtenir 3 options aléatoires différentes
        const options = getRandomOptions(this.rappelTable, item);

        // Ajouter l'item correct aux options
        options.push(item);

        // Mélanger les options
        const shuffledOptions = shuffleArray(options);

        // Vider le conteneur d'options
        if (this.optionsContainer) {
            this.optionsContainer.innerHTML = '';
        }

        // Créer les éléments d'option
        shuffledOptions.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option-item';
            optionElement.innerHTML = `<i class="icon-minecraft icon-minecraft-${option.icon}"></i>`;

            // Ajouter l'événement de clic
            optionElement.addEventListener('click', () => this.selectOption(option));

            if (this.optionsContainer) {
                this.optionsContainer.appendChild(optionElement);
            }
        });

        // Réinitialiser le message de résultat
        if (this.itemResult) {
            this.itemResult.textContent = '';
        }
    }

    selectOption(selectedOption) {
        if (!this.currentItem || this.scoreDisplay === null || this.itemResult === null) return;

        if (selectedOption.key === this.currentItem.key) {
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