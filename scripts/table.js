// Variables globales
let userTable = [];
const API_URL = 'http://localhost:3000/api/entries';

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadMinecraftItems();
    loadUserTable();
    setupFormListener();
    setupSearchFilter();
});

// Charger la table de l'utilisateur depuis l'API
async function loadUserTable() {
    try {
        // Afficher un indicateur de chargement
        const tableBody = document.querySelector('#entries-table tbody');
        tableBody.innerHTML = '<tr><td colspan="3">Chargement des données...</td></tr>';

        // Récupérer les données depuis l'API
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        userTable = await response.json();
        loadEntries();
    } catch (error) {
        console.error("Erreur lors du chargement de la table:", error);

        // Afficher un message d'erreur dans le tableau
        const tableBody = document.querySelector('#entries-table tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" style="color: red;">
                    Erreur de connexion au serveur. Veuillez vérifier que le serveur est démarré.
                    <button onclick="location.reload()">Réessayer</button>
                </td>
            </tr>
        `;
    }
}

// Charger les items Minecraft depuis le fichier JSON
async function loadMinecraftItems() {
    try {
        const response = await fetch('Library/minecraft-block-and-entity.json');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des items');
        }
        const items = await response.json();
        initializeIconSelect(items);
    } catch (error) {
        console.error('Erreur:', error);
        // Fallback avec quelques items si le fichier n'est pas accessible
        const fallbackItems = [
            { "label": "Diamond Sword", "name": "diamond_sword", "css": "icon-minecraft-diamond-sword" },
            { "label": "Diamond Pickaxe", "name": "diamond_pickaxe", "css": "icon-minecraft-diamond-pickaxe" },
            { "label": "Diamond Axe", "name": "diamond_axe", "css": "icon-minecraft-diamond-axe" }
        ];
        initializeIconSelect(fallbackItems);
    }
}

// Initialiser le select avec les icônes
function initializeIconSelect(items) {
    const select = document.getElementById('item-icon');
    select.innerHTML = '<option value="">Sélectionnez un objet</option>';

    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.css.replace('icon-minecraft-', ''); // Enregistrer seulement la partie après "icon-minecraft-"
        option.setAttribute('data-css', item.css);
        option.setAttribute('data-label', item.label);
        option.innerHTML = `${item.label}`;
        select.appendChild(option);
    });

    // Ajouter l'événement change pour afficher l'aperçu
    select.addEventListener('change', updateIconPreview);
}

// Mettre à jour l'aperçu de l'icône quand un élément est sélectionné
function updateIconPreview() {
    const select = document.getElementById('item-icon');
    const selectedOption = select.options[select.selectedIndex];
    const previewContainer = document.getElementById('icon-preview');

    if (select.value) {
        // S'assurer que la classe CSS complète est utilisée
        const iconClass = `icon-minecraft icon-minecraft-${select.value}`;
        previewContainer.innerHTML = `<i class="${iconClass}"></i>`;
        previewContainer.style.display = 'flex';
    } else {
        previewContainer.innerHTML = '';
        previewContainer.style.display = 'none';
    }
}

// Configurer la recherche pour filtrer les items
function setupSearchFilter() {
    const searchInput = document.getElementById('search-item');
    searchInput.addEventListener('input', filterItems);
}

// Filtrer les items en fonction de la recherche
function filterItems() {
    const searchInput = document.getElementById('search-item');
    const filter = searchInput.value.toLowerCase();
    const select = document.getElementById('item-icon');
    const options = select.options;

    for (let i = 1; i < options.length; i++) { // Commencer à 1 pour sauter l'option vide
        const label = options[i].getAttribute('data-label').toLowerCase();
        if (label.includes(filter)) {
            options[i].style.display = '';
        } else {
            options[i].style.display = 'none';
        }
    }
}

// Charger les entrées existantes
function loadEntries() {
    // Afficher les entrées dans le tableau
    const tbody = document.querySelector('#entries-table tbody');
    tbody.innerHTML = '';

    if (!userTable || userTable.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Aucune entrée trouvée</td></tr>';
        return;
    }

    userTable.forEach(entry => {
        const tr = document.createElement('tr');
        const isDefault = entry.isDefault ? '(Défaut)' : '';

        tr.innerHTML = `
            <td>${entry.number}</td>
            <td><i class="icon-minecraft icon-minecraft-${entry.icon}"></i> ${entry.icon} ${isDefault}</td>
            <td>
                <button onclick="deleteEntry(${entry.number})" class="delete-btn">Supprimer</button>
            </td>
        `;

        // Ajouter une classe pour les entrées par défaut
        if (entry.isDefault) {
            tr.classList.add('default-entry');
        }

        tbody.appendChild(tr);
    });
}

// Configurer l'écouteur du formulaire
function setupFormListener() {
    const form = document.getElementById('add-entry-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const icon = document.getElementById('item-icon').value;
        const number = parseInt(document.getElementById('item-number').value);

        if (!icon || isNaN(number) || number < 0 || number > 99) {
            alert('Veuillez remplir tous les champs correctement');
            return;
        }

        try {
            await addEntry(icon, number);
            form.reset();
            document.getElementById('icon-preview').innerHTML = '';
            document.getElementById('icon-preview').style.display = 'none';
        } catch (error) {
            console.error("Erreur lors de l'ajout:", error);
            alert("Erreur lors de l'ajout de l'entrée. Vérifiez la connexion au serveur.");
        }
    });
}

// Ajouter une nouvelle entrée
async function addEntry(icon, number) {
    // Vérifier si le numéro existe déjà localement
    const existingIndex = userTable.findIndex(entry => entry.number === number);

    if (existingIndex !== -1) {
        if (!confirm('Ce numéro est déjà utilisé. Voulez-vous remplacer l\'entrée existante?')) {
            return;
        }
    }

    try {
        // Préparer les données à envoyer
        const entryData = {
            number,
            icon,
            material: 'custom'
        };

        // Envoyer à l'API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entryData)
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result = await response.json();

        // Mettre à jour la table locale avec les données du serveur
        userTable = result.entries;

        // Mettre à jour l'affichage
        loadEntries();

        // Afficher un message de succès
        alert('Entrée ajoutée avec succès !');
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'entrée:", error);
        throw error;
    }
}

// Supprimer une entrée
async function deleteEntry(number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
        const entryIndex = userTable.findIndex(entry => entry.number === number);

        if (entryIndex === -1) {
            alert("Entrée introuvable");
            return;
        }

        try {
            // Envoyer la requête de suppression à l'API
            const response = await fetch(`${API_URL}/${number}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();

            // Mettre à jour la table locale avec les données du serveur
            userTable = result.entries;

            // Mettre à jour l'affichage
            loadEntries();

            alert('Entrée supprimée avec succès !');
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            alert("Erreur lors de la suppression. Vérifiez la connexion au serveur.");
        }
    }
}

// Exposer deleteEntry pour le HTML
window.deleteEntry = deleteEntry; 