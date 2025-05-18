// Fonction pour obtenir un élément aléatoire
export function getRandomItem(itemsArray) {
    // itemsArray est un tableau d'objets [{number: 0, icon: "...", ...}, ...]
    if (!itemsArray || itemsArray.length === 0) {
        console.error("Tentative d'obtenir un item aléatoire d'un tableau vide ou non défini.");
        // Retourner un objet par défaut ou gérer l'erreur comme il convient
        return { key: '0', icon: 'question-mark', material: 'unknown' }; // Exemple de fallback
    }
    const randomIndex = Math.floor(Math.random() * itemsArray.length);
    const randomEntry = itemsArray[randomIndex];
    // Assurer que la sortie a une propriété 'key' comme attendu par l'ancien code
    return { ...randomEntry, key: String(randomEntry.number) };
}

// Fonction pour obtenir 3 éléments aléatoires différents
export function getRandomOptions(itemsArray, excludeItem) {
    // itemsArray est un tableau d'objets
    // excludeItem est un objet avec une propriété 'number' (ou 'key' après adaptation)
    if (!itemsArray || itemsArray.length === 0) {
        console.error("Tentative d'obtenir des options aléatoires d'un tableau vide ou non défini.");
        return [];
    }

    const options = [];
    const excludeItemNumber = parseInt(excludeItem.key); // 'key' est maintenant String(number)

    // S'assurer qu'il y a suffisamment d'éléments pour choisir
    const availableItems = itemsArray.filter(item => item.number !== excludeItemNumber);
    if (availableItems.length < 3) {
        console.warn("Pas assez d'items disponibles pour générer 3 options distinctes.");
        // Retourner ce qui est disponible, potentiellement moins de 3 options.
        // Ou remplir avec des doublons si la logique du jeu le permet, mais ici on préfère distinct.
        return availableItems.map(item => ({ ...item, key: String(item.number) }));
    }

    while (options.length < 3) {
        const randomIndex = Math.floor(Math.random() * itemsArray.length);
        const potentialOption = itemsArray[randomIndex];
        // Vérifier si l'option n'est pas l'item à exclure et n'est pas déjà dans les options
        if (potentialOption.number !== excludeItemNumber && !options.some(opt => opt.number === potentialOption.number)) {
            options.push({ ...potentialOption, key: String(potentialOption.number) });
        }
    }
    return options;
}

// Fonction pour mélanger un tableau
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
} 