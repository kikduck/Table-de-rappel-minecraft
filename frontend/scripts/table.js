// Variables globales
let tablesData = [];
let currentEditingTable = null;
let userTable = [];

// Détection automatique de l'URL de l'API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/entries'  // En développement local
    : `${window.location.origin}/api/entries`; // Sur le serveur

const API_TABLES_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/tables'  // En développement local
    : `${window.location.origin}/api/tables`; // Sur le serveur

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadTables();
    setupCreateTableForm();
    setupEntryForm();
    loadMinecraftItems();
    setupSearchFilter();
});

// Charger toutes les tables
async function loadTables() {
    try {
        const response = await fetch(API_TABLES_URL);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        tablesData = data.tables;
        displayTables();
    } catch (error) {
        console.error("Erreur lors du chargement des tables:", error);
        showError("Erreur de connexion au serveur. Veuillez vérifier que le serveur est démarré.");
    }
}

// Afficher les tables dans la grille
function displayTables() {
    const tablesGrid = document.getElementById('tables-grid');
    tablesGrid.innerHTML = '';

    if (tablesData.length === 0) {
        tablesGrid.innerHTML = '<p>Aucune table trouvée. Créez votre première table !</p>';
        return;
    }

    tablesData.forEach(table => {
        const tableCard = createTableCard(table);
        tablesGrid.appendChild(tableCard);
    });
}

// Mettre à jour le compteur d'entrées d'une table spécifique
function updateTableEntryCount(tableId, newCount) {
    // Mettre à jour les données locales
    const tableIndex = tablesData.findIndex(table => table.id === tableId);
    if (tableIndex !== -1) {
        tablesData[tableIndex].entryCount = newCount;
    }

    // Mettre à jour l'affichage visuel
    const tableCards = document.querySelectorAll('.table-card');
    tableCards.forEach(card => {
        const manageButton = card.querySelector('button[onclick*="editTable"]');
        if (manageButton && manageButton.getAttribute('onclick').includes(`'${tableId}'`)) {
            const infoDiv = card.querySelector('.table-info');
            if (infoDiv) {
                infoDiv.textContent = `${newCount} entrée${newCount !== 1 ? 's' : ''}`;
            }
        }
    });
}

// Créer une carte de table
function createTableCard(table) {
    const card = document.createElement('div');
    card.className = 'table-card';
    card.innerHTML = `
        <h4>
            ${table.name}
            ${table.id === 'default' ? '<span class="current-badge">Défaut</span>' : ''}
        </h4>
        <div class="table-info">
            ${table.entryCount} entrée${table.entryCount !== 1 ? 's' : ''}
        </div>
        <div class="table-buttons">
            <button class="btn btn-primary" onclick="editTable('${table.id}')">
                Gérer les entrées
            </button>
            <button class="btn btn-success" onclick="setCurrentTable('${table.id}')">
                Utiliser cette table
            </button>
            ${table.id !== 'default' ? `<button class="btn btn-danger" onclick="deleteTable('${table.id}')">Supprimer</button>` : ''}
        </div>
    `;
    return card;
}

// Configurer le formulaire de création de table
function setupCreateTableForm() {
    const form = document.getElementById('create-table-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const tableName = document.getElementById('table-name').value.trim();
        if (!tableName) {
            alert('Veuillez entrer un nom pour la table');
            return;
        }

        try {
            const response = await fetch(API_TABLES_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: tableName }),
            });

            const result = await response.json();

            if (response.ok) {
                document.getElementById('table-name').value = '';
                await loadTables(); // Recharger la liste des tables
                showSuccess('Table créée avec succès !');
            } else {
                throw new Error(result.error || 'Erreur lors de la création de la table');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert(`Erreur lors de la création de la table: ${error.message}`);
        }
    });
}

// Supprimer une table
async function deleteTable(tableId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette table ? Cette action est irréversible.')) {
        return;
    }

    try {
        const response = await fetch(`${API_TABLES_URL}/${tableId}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok) {
            await loadTables();
            showSuccess('Table supprimée avec succès !');

            // Si on était en train de modifier cette table, fermer la section
            if (currentEditingTable === tableId) {
                closeTableEditor();
            }
        } else {
            throw new Error(result.error || 'Erreur lors de la suppression de la table');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur lors de la suppression de la table: ${error.message}`);
    }
}

// Définir la table courante
async function setCurrentTable(tableId) {
    try {
        const response = await fetch(`${API_TABLES_URL}/current/${tableId}`, {
            method: 'PUT',
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess('Table courante mise à jour !');
        } else {
            throw new Error(result.error || 'Erreur lors de la mise à jour de la table courante');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur lors de la mise à jour: ${error.message}`);
    }
}

// Éditer une table (gérer ses entrées)
async function editTable(tableId) {
    currentEditingTable = tableId;
    const table = tablesData.find(t => t.id === tableId);

    if (!table) {
        alert('Table non trouvée');
        return;
    }

    // Afficher la section d'édition
    document.getElementById('table-entries-section').style.display = 'block';
    document.getElementById('current-table-title').textContent = `Gestion des entrées - ${table.name}`;

    // Charger les entrées de cette table
    await loadTableEntries(tableId);

    // Faire défiler vers la section d'édition
    document.getElementById('table-entries-section').scrollIntoView({ behavior: 'smooth' });
}

// Fermer l'éditeur de table
function closeTableEditor() {
    document.getElementById('table-entries-section').style.display = 'none';
    currentEditingTable = null;
    userTable = [];
}

// Charger les entrées d'une table
async function loadTableEntries(tableId) {
    try {
        const response = await fetch(`${API_URL}/${tableId}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        userTable = await response.json();
        loadEntries();
    } catch (error) {
        console.error("Erreur lors du chargement des entrées:", error);
        showError("Erreur lors du chargement des entrées de la table.");
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
        option.value = item.css.replace('icon-minecraft-', '');
        option.setAttribute('data-css', item.css);
        option.setAttribute('data-label', item.label);
        option.innerHTML = `${item.label}`;
        select.appendChild(option);
    });

    // Ajouter l'événement change pour afficher l'aperçu
    select.addEventListener('change', updateIconPreview);
}

// Mettre à jour l'aperçu de l'icône
function updateIconPreview() {
    const select = document.getElementById('item-icon');
    const selectedOption = select.options[select.selectedIndex];
    const previewContainer = document.getElementById('icon-preview');

    if (select.value) {
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

    for (let i = 1; i < options.length; i++) {
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

        if (entry.isDefault) {
            tr.classList.add('default-entry');
        }

        tbody.appendChild(tr);
    });
}

// Configurer l'écouteur du formulaire d'entrée
function setupEntryForm() {
    const form = document.getElementById('add-entry-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentEditingTable) {
            alert('Veuillez d\'abord sélectionner une table à éditer');
            return;
        }

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
    const existingIndex = userTable.findIndex(entry => entry.number === number);

    if (existingIndex !== -1) {
        if (!confirm('Ce numéro est déjà utilisé. Voulez-vous remplacer l\'entrée existante?')) {
            return;
        }
    }

    try {
        const entryData = {
            number,
            icon,
            isDefault: false
        };

        const response = await fetch(`${API_URL}/${currentEditingTable}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entryData),
        });

        const result = await response.json();

        if (response.ok) {
            userTable = result.entries;
            loadEntries();
            updateTableEntryCount(currentEditingTable, result.entries.length); // Mettre à jour seulement le compte

            // S'assurer que l'éditeur reste ouvert
            const editorSection = document.getElementById('table-entries-section');
            if (editorSection.style.display === 'none') {
                editorSection.style.display = 'block';
            }

            showSuccess('Entrée ajoutée avec succès !');
        } else {
            throw new Error(result.error || 'Erreur lors de l\'ajout de l\'entrée');
        }
    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    }
}

// Supprimer une entrée
async function deleteEntry(number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
        return;
    }

    if (!currentEditingTable) {
        alert('Erreur: aucune table sélectionnée');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${currentEditingTable}/${number}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok) {
            userTable = result.entries;
            loadEntries();
            updateTableEntryCount(currentEditingTable, result.entries.length); // Mettre à jour seulement le compte

            // S'assurer que l'éditeur reste ouvert
            const editorSection = document.getElementById('table-entries-section');
            if (editorSection.style.display === 'none') {
                editorSection.style.display = 'block';
            }

            showSuccess('Entrée supprimée avec succès !');
        } else {
            throw new Error(result.error || 'Erreur lors de la suppression de l\'entrée');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur lors de la suppression: ${error.message}`);
    }
}

// Fonctions utilitaires pour les messages
function showError(message) {
    // Créer un message d'erreur temporaire
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #f44336;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
        max-width: 300px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 5000);
}

function showSuccess(message) {
    // Créer un message de succès temporaire
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
        max-width: 300px;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        document.body.removeChild(successDiv);
    }, 3000);
}

// Rendre les fonctions globales pour les boutons
window.editTable = editTable;
window.deleteTable = deleteTable;
window.setCurrentTable = setCurrentTable;
window.deleteEntry = deleteEntry; 