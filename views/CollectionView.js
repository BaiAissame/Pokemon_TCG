// views/CollectionView.js
export default class CollectionView {
    constructor() {
        this.currentView = 'grid';
        this.selectedCards = new Set();
        this.currentDeck = []; // Stockage local du deck
    }

    // MÉTHODE MISE À JOUR : accepte maintenant le paramètre currentDeck
    renderCollection(cards, stats, filters, currentDeck = []) {
        const container = document.getElementById('collectionContainer');
        if (!container) return;

        // Stocker le deck pour l'utiliser dans d'autres méthodes
        this.currentDeck = currentDeck;

        container.innerHTML = this.generateCollectionHTML(cards, stats, filters, currentDeck);
        this.attachEventListeners();
    }

    // MÉTHODE MISE À JOUR : accepte maintenant le paramètre currentDeck
    generateCollectionHTML(cards, stats, filters, currentDeck = []) {
        return `
            <div class="collection-header">
                <div class="collection-title">
                    <h2>📚 Ma Collection</h2>
                </div>
    
                <div class="collection-actions">
                    <button class="btn btn-secondary" id="collectionStatsBtn">
                        📊 Statistiques
                    </button>
                </div>
            </div>
    
            <div class="collection-controls">
                <div class="search-bar">
                    <input type="text" id="collectionSearch" placeholder="🔍 Rechercher une carte..."
                           value="${filters.searchQuery || ''}" class="search-input">
                    <button class="btn-icon" id="clearSearchBtn" title="Effacer la recherche">❌</button>
                </div>
            </div>
    
            <div class="collection-content">
                ${cards.length === 0 ? this.generateEmptyStateHTML() : this.generateCardsHTML(cards)}
            </div>
        `;
    }

    generateEmptyStateHTML() {
        return `
            <div class="empty-collection">
                <h3>Votre collection est vide</h3>
                <p>Vous n'avez pas encore de cartes dans votre collection.</p>
            </div>
        `;
    }

    generateTypeOptions(typeStats, selectedType) {
        return Object.keys(typeStats)
            .sort()
            .map(type => `<option value="${type}" ${selectedType === type ? 'selected' : ''}>${type} (${typeStats[type]})</option>`)
            .join('');
    }

    generateCardsHTML(cards) {
        if (this.currentView === 'grid') {
            return this.generateGridView(cards);
        } else {
            return this.generateListView(cards);
        }
    }

    generateGridView(cards) {
        return `
            <div class="collection-grid">
                ${cards.map(card => this.generateCardGridItem(card)).join('')}
            </div>
        `;
    }

    generateListView(cards) {
        return `
            <div class="collection-list">
                <div class="list-header">
                    <span class="col-image">Image</span>
                    <span class="col-name">Nom</span>
                    <span class="col-type">Type</span>
                    <span class="col-rarity">Rareté</span>
                    <span class="col-hp">PV</span>
                    <span class="col-used">Utilisée</span>
                    <span class="col-deck">Dans Deck</span>
                    <span class="col-actions">Actions</span>
                </div>
                ${cards.map(card => this.generateCardListItem(card)).join('')}
            </div>
        `;
    }

    // MÉTHODE MISE À JOUR : affiche si la carte est dans le deck
    generateCardGridItem(card) {
        const isSelected = this.selectedCards.has(card.id);
        const isInDeck = this.isCardInDeck(card.id);
        
        return `
            <div class="card-image-container clickable-card" data-card-id="${card.id}">
                    ${card.image
                        ? `<img src="${card.image}" alt="${card.name}" class="card-image" loading="lazy">`
                        : `<div class="card-placeholder">${card.name}</div>`
                    }
                </div>
        `;
    }

    // MÉTHODE MISE À JOUR : affiche si la carte est dans le deck
    generateCardListItem(card) {
        const isSelected = this.selectedCards.has(card.id);
        const isInDeck = this.isCardInDeck(card.id);
        
        return `
            <div class="collection-list-item ${isSelected ? 'selected' : ''} ${isInDeck ? 'in-deck' : ''}" data-card-id="${card.id}">

                <div class="col-image">
                    ${card.image
                        ? `<img src="${card.image}" alt="${card.name}" class="list-card-image" loading="lazy">`
                        : `<div class="list-card-placeholder">${card.name.substring(0, 3)}</div>`
                    }
                </div>

                <div class="col-name">
                    <span class="card-name">${card.name}</span>
                    ${card.favorited ? '<span class="favorite-indicator">❤️</span>' : ''}
                    ${isInDeck ? '<span class="deck-indicator">🎴</span>' : ''}
                </div>

                <div class="col-type">
                    <span class="type-badge ${card.getTypeClass()}">${card.types?.[0]?.name || 'Unknown'}</span>
                </div>

                <div class="col-rarity">
                    <span class="rarity-badge ${card.rarity?.name?.toLowerCase()}">${card.rarity?.name || 'Common'}</span>
                </div>

                <div class="col-hp">${card.getHP()}</div>

                <div class="col-used">${card.timesUsed || 0}x</div>

                <div class="col-deck">
                    ${isInDeck ? '✅ Oui' : '❌ Non'}
                </div>

                <div class="col-actions">
                    <button class="btn-icon favorite-btn ${card.favorited ? 'favorited' : ''}"
                            data-card-id="${card.id}" title="Favori">
                        ${card.favorited ? '❤️' : '🤍'}
                    </button>
                    <button class="btn-icon details-btn" data-card-id="${card.id}" title="Détails">👁️</button>
                    <button class="btn-icon add-to-deck-btn ${isInDeck ? 'disabled' : ''}" 
                            data-card-id="${card.id}" 
                            title="${isInDeck ? 'Déjà dans le deck' : 'Ajouter au deck'}"
                            ${isInDeck ? 'disabled' : ''}>
                        ${isInDeck ? '✅' : '➕'}
                    </button>
                </div>
            </div>
        `;
    }

    // NOUVELLE MÉTHODE : vérifier si une carte est dans le deck
    isCardInDeck(cardId) {
        return this.currentDeck.some(deckCard => deckCard.id === cardId);
    }

    // NOUVELLE MÉTHODE : compter le nombre de fois qu'une carte est dans le deck
    getCardCountInDeck(cardId) {
        return this.currentDeck.filter(deckCard => deckCard.id === cardId).length;
    }


    attachEventListeners() {
        const searchInput = document.getElementById('collectionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.onSearch(e.target.value);
            });
        }
    
        // Bouton pour effacer la recherche
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('collectionSearch');
                if (searchInput) {
                    searchInput.value = '';
                    this.onSearch('');
                }
            });
        }
    
        // Bouton pour effacer tous les filtres
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                if (this.controller) {
                    // Effacer tous les filtres
                    this.controller.clearFilters();
                    
                    // Réinitialiser les éléments de l'interface
                    document.getElementById('collectionSearch').value = '';
                    document.getElementById('typeFilter').value = '';
                    document.getElementById('rarityFilter').value = '';
                    document.getElementById('favoritedFilter').value = '';
                    document.getElementById('sortFilter').value = 'dateAdded';
                    
                    // Rafraîchir la vue
                    this.controller.refreshView();
                }
            });
        }
    
        // Filtres
        ['typeFilter', 'rarityFilter', 'favoritedFilter', 'sortFilter'].forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.onFilterChange(filterId.replace('Filter', ''), e.target.value);
                });
            }
        });
    
        // Autres événements...
        this.attachCardEventListeners();
        
        // Boutons de vue
        document.getElementById('gridViewBtn')?.addEventListener('click', () => this.changeView('grid'));
        document.getElementById('listViewBtn')?.addEventListener('click', () => this.changeView('list'));
        document.getElementById('selectModeBtn')?.addEventListener('click', () => this.toggleSelectionMode());
    
        // Boutons de sélection
        document.getElementById('addSelectedToDeckBtn')?.addEventListener('click', () => this.onAddSelectedToDeck());
        document.getElementById('removeSelectedBtn')?.addEventListener('click', () => this.onRemoveSelected());
        document.getElementById('clearSelectionBtn')?.addEventListener('click', () => this.clearSelection());
    }

    onSearch(query) {
        if (this.controller) {
            const results = this.controller.searchCards(query);
            // Rafraîchir la vue avec les résultats
            this.renderFilteredResults(results);
        }
    }
    renderFilteredResults(cards) {
        const contentContainer = document.querySelector('.collection-content');
        if (!contentContainer) return;
        
        if (cards.length === 0) {
            contentContainer.innerHTML = `
                <div class="no-results">
                    <h3>Aucune carte trouvée</h3>
                    <p>Essayez de modifier votre recherche ou vos filtres.</p>
                </div>
            `;
            return;
        }
        
        contentContainer.innerHTML = this.generateCardsHTML(cards);
        this.attachCardEventListeners(); // Réattacher les événements aux nouvelles cartes
    }

    attachCardEventListeners() {
        // Événements pour les cartes cliquables
        document.querySelectorAll('.clickable-card').forEach(cardElement => {
            cardElement.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = cardElement.dataset.cardId;
                this.onShowCardDetails(cardId);
            });
        });
    
        // Événements pour les boutons favoris
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onToggleFavorite(btn.dataset.cardId);
            });
        });
    
        // Événements pour les boutons détails
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onShowCardDetails(btn.dataset.cardId);
            });
        });
    
        // Événements pour les boutons d'ajout au deck
        document.querySelectorAll('.add-to-deck-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!btn.disabled) {
                    this.onAddToDeck(btn.dataset.cardId);
                }
            });
        });
    }

    onFilterChange(filterType, value) {
        if (this.controller) {
            if (filterType === 'favorited') {
                // Convertir la string en boolean ou null
                const boolValue = value === 'true' ? true : value === 'false' ? false : null;
                const results = this.controller.setFilter(filterType, boolValue);
            } else {
                const results = this.controller.setFilter(filterType, value || null);
            }
            // La vue sera rafraîchie automatiquement par le controller.refreshView()
        }
    }
    
    

    // NOUVELLE MÉTHODE : gérer le filtrage par deck
    handleDeckFilter(value) {
        // Cette méthode devra être implémentée dans le contrôleur
        // Pour l'instant, on peut simuler en filtrant côté vue
        if (value === 'inDeck') {
            // Filtrer pour ne montrer que les cartes dans le deck
            console.log('Filtrer: cartes dans le deck');
        } else if (value === 'notInDeck') {
            // Filtrer pour ne montrer que les cartes pas dans le deck
            console.log('Filtrer: cartes pas dans le deck');
        }
        // Vous devrez étendre le contrôleur pour gérer ce type de filtre
    }

    onToggleFavorite(cardId) {
        if (this.controller) {
            this.controller.toggleFavorite(cardId);
        }
    }

    onShowCardDetails(cardId) {
        if (this.controller) {
            this.controller.showCardDetails(cardId);
        }
    }

    showCardDetails(card) {
        const modal = document.getElementById('cardModal');
        const cardDetail = document.getElementById('cardDetail');

        if (!modal || !cardDetail) return;

        const isInDeck = this.isCardInDeck(card.id);
        const deckCount = this.getCardCountInDeck(card.id);

        cardDetail.innerHTML = `
            <div class="card-detail-container">
                <div class="card-detail-image">
                    ${card.image
                        ? `<img src="${card.image}" alt="${card.name}" class="detail-card-image">`
                        : `<div class="detail-card-placeholder">${card.name}</div>`
                    }
                    ${isInDeck ? '<div class="detail-deck-badge">🎴 Dans le deck</div>' : ''}
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    onAddToDeck(cardId) {
        if (this.controller) {
            this.controller.addCardToDeck(cardId);
        }
    }

    toggleCardSelection(cardId) {
        if (this.selectedCards.has(cardId)) {
            this.selectedCards.delete(cardId);
        } else {
            this.selectedCards.add(cardId);
        }
        this.updateSelectionUI();
    }

    clearSelection() {
        this.selectedCards.clear();
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        document.querySelectorAll('.collection-card, .collection-list-item').forEach(card => {
            const isSelected = this.selectedCards.has(card.dataset.cardId);
            card.classList.toggle('selected', isSelected);

            const checkbox = card.querySelector('.card-checkbox, .list-checkbox');
            if (checkbox) {
                checkbox.classList.toggle('checked', isSelected);
            }
        });

        const toolbar = document.querySelector('.selection-toolbar');
        if (toolbar) {
            const info = toolbar.querySelector('.selection-info span');
            if (info) {
                info.textContent = `${this.selectedCards.size} carte(s) sélectionnée(s)`;
            }

            const addBtn = toolbar.querySelector('#addSelectedToDeckBtn');
            if (addBtn) {
                addBtn.textContent = `➕ Ajouter au deck (${this.selectedCards.size})`;
            }
        }
    }

    changeView(viewType) {
        this.currentView = viewType;
        if (this.controller) {
            this.controller.refreshView();
        }
    }

    onAddSelectedToDeck() {
        if (this.controller) {
            this.controller.addMultipleCardsToDeck(Array.from(this.selectedCards));
            this.clearSelection();
        }
    }

    onFavoriteSelected() {
        if (this.controller) {
            Array.from(this.selectedCards).forEach(cardId => {
                this.controller.toggleFavorite(cardId);
            });
        }
    }

    onRemoveSelected() {
        if (this.controller && confirm(`Voulez-vous vraiment supprimer ${this.selectedCards.size} carte(s) de votre collection ?`)) {
            Array.from(this.selectedCards).forEach(cardId => {
                this.controller.removeCardFromCollection(cardId);
            });
            this.clearSelection();
        }
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showStats(stats) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                <h2 style="padding-bottom: 2em;">📊 Statistiques de Collection</h2>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">Cartes totales</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.rare}</div>
                        <div class="stat-label">Cartes rares</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.currentDeck.length}</div>
                        <div class="stat-label">Dans le deck</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    setController(controller) {
        this.controller = controller;
    }

    onCollectionUpdated(collection) {
        if (this.controller && document.getElementById('collectionContainer')) {
            this.controller.refreshView();
        }
    }

    onStateChange(gameState) {
        if (this.controller && document.getElementById('collectionContainer')) {
            this.controller.refreshView();
        }
    }
}