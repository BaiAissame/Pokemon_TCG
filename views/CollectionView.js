// views/CollectionView.js
export default class CollectionView {
    constructor() {
        this.currentView = 'grid';
        this.selectedCards = new Set();
        this.isSelectionMode = false;
    }

    renderCollection(cards, stats, filters) {
        const container = document.getElementById('collectionContainer');
        if (!container) return;

        container.innerHTML = this.generateCollectionHTML(cards, stats, filters);
        this.attachEventListeners();
    }

    generateCollectionHTML(cards, stats, filters) {
        return `
            <div class="collection-header">
                <div class="collection-title">
                    <h2>📚 Ma Collection</h2>
                    <div class="collection-stats">
                        <span class="stat-badge">📦 ${stats.total} cartes</span>
                        <span class="stat-badge rare">✨ ${stats.rare} rares</span>
                        <span class="stat-badge favorited">❤️ ${stats.favorited} favorites</span>
                    </div>
                </div>

                <div class="collection-actions">
                    <button class="btn btn-primary" id="deckBuilderBtn">
                        🏗️ Constructeur de Deck
                    </button>
                    <button class="btn btn-secondary" id="collectionStatsBtn">
                        📊 Statistiques
                    </button>
                    <button class="btn btn-secondary" id="exportCollectionBtn">
                        📤 Exporter
                    </button>
                </div>
            </div>

            <div class="collection-controls">
                <div class="search-bar">
                    <input type="text" id="collectionSearch" placeholder="🔍 Rechercher une carte..."
                           value="${filters.searchQuery || ''}" class="search-input">
                    <button class="btn-icon" id="clearSearchBtn">❌</button>
                </div>

                <div class="collection-filters">
                    <select id="typeFilter" class="filter-select">
                        <option value="">Tous les types</option>
                        ${this.generateTypeOptions(stats.byType, filters.type)}
                    </select>

                    <select id="rarityFilter" class="filter-select">
                        <option value="">Toutes les raretés</option>
                        <option value="Common" ${filters.rarity === 'Common' ? 'selected' : ''}>Commune</option>
                        <option value="Uncommon" ${filters.rarity === 'Uncommon' ? 'selected' : ''}>Peu commune</option>
                        <option value="Rare" ${filters.rarity === 'Rare' ? 'selected' : ''}>Rare</option>
                        <option value="Ultra Rare" ${filters.rarity === 'Ultra Rare' ? 'selected' : ''}>Ultra Rare</option>
                        <option value="Secret Rare" ${filters.rarity === 'Secret Rare' ? 'selected' : ''}>Secret Rare</option>
                    </select>

                    <select id="favoritedFilter" class="filter-select">
                        <option value="">Toutes les cartes</option>
                        <option value="true" ${filters.favorited === true ? 'selected' : ''}>Favorites seulement</option>
                        <option value="false" ${filters.favorited === false ? 'selected' : ''}>Non favorites</option>
                    </select>

                    <select id="sortFilter" class="filter-select">
                        <option value="dateAdded" ${filters.sortBy === 'dateAdded' ? 'selected' : ''}>Date d'ajout</option>
                        <option value="name" ${filters.sortBy === 'name' ? 'selected' : ''}>Nom</option>
                        <option value="rarity" ${filters.sortBy === 'rarity' ? 'selected' : ''}>Rareté</option>
                        <option value="timesUsed" ${filters.sortBy === 'timesUsed' ? 'selected' : ''}>Utilisation</option>
                    </select>
                </div>

                <div class="view-controls">
                    <button class="btn-icon ${this.currentView === 'grid' ? 'active' : ''}" id="gridViewBtn">🎴</button>
                    <button class="btn-icon ${this.currentView === 'list' ? 'active' : ''}" id="listViewBtn">📝</button>
                    <button class="btn-icon" id="selectModeBtn" title="Mode sélection">
                        ${this.isSelectionMode ? '✅' : '☑️'}
                    </button>
                </div>
            </div>

            <div class="collection-content">
                ${cards.length === 0 ? this.generateEmptyState() : this.generateCardsHTML(cards)}
            </div>

            ${this.isSelectionMode ? this.generateSelectionToolbar() : ''}
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
                    <span class="col-actions">Actions</span>
                </div>
                ${cards.map(card => this.generateCardListItem(card)).join('')}
            </div>
        `;
    }

    generateCardGridItem(card) {
        const isSelected = this.selectedCards.has(card.id);
        return `
            <div class="collection-card ${card.getTypeClass()} ${isSelected ? 'selected' : ''}"
                 data-card-id="${card.id}">
                ${this.isSelectionMode ? `<div class="card-checkbox ${isSelected ? 'checked' : ''}">✓</div>` : ''}

                <div class="card-image-container">
                    ${card.image
                        ? `<img src="${card.image}" alt="${card.name}" class="card-image" loading="lazy">`
                        : `<div class="card-placeholder">${card.name}</div>`
                    }
                    <div class="card-overlay">
                        <button class="btn-icon favorite-btn ${card.favorited ? 'favorited' : ''}"
                                data-card-id="${card.id}" title="Favori">
                            ${card.favorited ? '❤️' : '🤍'}
                        </button>
                        <button class="btn-icon details-btn" data-card-id="${card.id}" title="Détails">
                            👁️
                        </button>
                    </div>
                </div>

                <div class="card-info">
                    <div class="card-name">${card.name}</div>
                    <div class="card-type">${card.types?.[0]?.name || 'Unknown'}</div>
                    <div class="card-stats">
                        <span class="hp">❤️ ${card.getHP()}</span>
                        <span class="attack">⚔️ ${card.getAttackPower()}</span>
                    </div>
                    <div class="card-meta">
                        <span class="rarity ${card.rarity?.name?.toLowerCase()}">${card.rarity?.name || 'Common'}</span>
                        <span class="usage">🎮 ${card.timesUsed || 0}x</span>
                    </div>
                </div>

                <div class="card-actions">
                    <button class="btn btn-small btn-primary add-to-deck-btn" data-card-id="${card.id}">
                        ➕ Deck
                    </button>
                </div>
            </div>
        `;
    }

    generateCardListItem(card) {
        const isSelected = this.selectedCards.has(card.id);
        return `
            <div class="collection-list-item ${isSelected ? 'selected' : ''}" data-card-id="${card.id}">
                ${this.isSelectionMode ? `<div class="list-checkbox ${isSelected ? 'checked' : ''}">✓</div>` : ''}

                <div class="col-image">
                    ${card.image
                        ? `<img src="${card.image}" alt="${card.name}" class="list-card-image" loading="lazy">`
                        : `<div class="list-card-placeholder">${card.name.substring(0, 3)}</div>`
                    }
                </div>

                <div class="col-name">
                    <span class="card-name">${card.name}</span>
                    ${card.favorited ? '<span class="favorite-indicator">❤️</span>' : ''}
                </div>

                <div class="col-type">
                    <span class="type-badge ${card.getTypeClass()}">${card.types?.[0]?.name || 'Unknown'}</span>
                </div>

                <div class="col-rarity">
                    <span class="rarity-badge ${card.rarity?.name?.toLowerCase()}">${card.rarity?.name || 'Common'}</span>
                </div>

                <div class="col-hp">${card.getHP()}</div>

                <div class="col-used">${card.timesUsed || 0}x</div>

                <div class="col-actions">
                    <button class="btn-icon favorite-btn ${card.favorited ? 'favorited' : ''}"
                            data-card-id="${card.id}" title="Favori">
                        ${card.favorited ? '❤️' : '🤍'}
                    </button>
                    <button class="btn-icon details-btn" data-card-id="${card.id}" title="Détails">👁️</button>
                    <button class="btn-icon add-to-deck-btn" data-card-id="${card.id}" title="Ajouter au deck">➕</button>
                </div>
            </div>
        `;
    }

    generateEmptyState() {
        return `
            <div class="empty-collection">
                <div class="empty-icon">📦</div>
                <h3>Votre collection est vide</h3>
                <p>Tirez vos premières cartes pour commencer votre collection!</p>
                <button class="btn btn-primary" onclick="window.app.navigateToGame()">
                    🎴 Tirer des cartes
                </button>
            </div>
        `;
    }

    generateSelectionToolbar() {
        return `
            <div class="selection-toolbar">
                <div class="selection-info">
                    <span>${this.selectedCards.size} carte(s) sélectionnée(s)</span>
                </div>
                <div class="selection-actions">
                    <button class="btn btn-primary" id="addSelectedToDeckBtn">
                        ➕ Ajouter au deck (${this.selectedCards.size})
                    </button>
                    <button class="btn btn-secondary" id="favoriteSelectedBtn">
                        ❤️ Marquer comme favoris
                    </button>
                    <button class="btn btn-danger" id="removeSelectedBtn">
                        🗑️ Supprimer
                    </button>
                    <button class="btn btn-secondary" id="clearSelectionBtn">
                        ❌ Désélectionner tout
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const searchInput = document.getElementById('collectionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.onSearch(e.target.value);
            });
        }

        ['typeFilter', 'rarityFilter', 'favoritedFilter', 'sortFilter'].forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.onFilterChange(filterId.replace('Filter', ''), e.target.value);
                });
            }
        });

        document.getElementById('gridViewBtn')?.addEventListener('click', () => this.changeView('grid'));
        document.getElementById('listViewBtn')?.addEventListener('click', () => this.changeView('list'));
        document.getElementById('selectModeBtn')?.addEventListener('click', () => this.toggleSelectionMode());

        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onToggleFavorite(btn.dataset.cardId);
            });
        });

        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onShowCardDetails(btn.dataset.cardId);
            });
        });

        document.querySelectorAll('.add-to-deck-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onAddToDeck(btn.dataset.cardId);
            });
        });

        if (this.isSelectionMode) {
            document.querySelectorAll('.collection-card, .collection-list-item').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) {
                        this.toggleCardSelection(card.dataset.cardId);
                    }
                });
            });
        }

        document.getElementById('addSelectedToDeckBtn')?.addEventListener('click', () => this.onAddSelectedToDeck());
        document.getElementById('favoriteSelectedBtn')?.addEventListener('click', () => this.onFavoriteSelected());
        document.getElementById('removeSelectedBtn')?.addEventListener('click', () => this.onRemoveSelected());
        document.getElementById('clearSelectionBtn')?.addEventListener('click', () => this.clearSelection());
    }

    onSearch(query) {
        if (this.controller) {
            this.controller.searchCards(query);
        }
    }

    onFilterChange(filterType, value) {
        if (this.controller) {
            this.controller.setFilter(filterType, value || null);
        }
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

        cardDetail.innerHTML = `
            <div class="card-detail-container">
                <div class="card-detail-image">
                    ${card.image
                        ? `<img src="${card.image}" alt="${card.name}" class="detail-card-image">`
                        : `<div class="detail-card-placeholder">${card.name}</div>`
                    }
                </div>
                <div class="card-detail-info">
                    <h2 class="card-detail-name">${card.name}</h2>

                    <div class="card-detail-meta">
                        <span class="card-detail-type ${card.getTypeClass()}">
                            ${card.types?.[0]?.name || 'Unknown'}
                        </span>
                        <span class="card-detail-rarity ${card.rarity?.name?.toLowerCase()}">
                            ${card.rarity?.name || 'Common'}
                        </span>
                        <span class="card-detail-hp">❤️ ${card.getHP()} PV</span>
                    </div>

                    <div class="card-detail-stats">
                        <div class="stat-row">
                            <span class="stat-label">Attaque:</span>
                            <span class="stat-value">⚔️ ${card.getAttackPower()}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Utilisée:</span>
                            <span class="stat-value">🎮 ${card.timesUsed || 0} fois</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Ajoutée le:</span>
                            <span class="stat-value">📅 ${new Date(card.addedAt || Date.now()).toLocaleDateString('fr-FR')}</span>
                        </div>
                    </div>

                    ${card.attacks && card.attacks.length > 0 ? `
                        <div class="card-detail-attacks">
                            <h4>⚔️ Attaques</h4>
                            ${card.attacks.slice(0, 2).map(attack => `
                                <div class="attack-item">
                                    <div class="attack-name">${attack.name}</div>
                                    <div class="attack-damage">${attack.damage || '?'} dégâts</div>
                                    ${attack.text ? `<div class="attack-text">${attack.text}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${card.weaknesses && card.weaknesses.length > 0 ? `
                        <div class="card-detail-weaknesses">
                            <h4>🔥 Faiblesses</h4>
                            <div class="weakness-list">
                                ${card.weaknesses.slice(0, 3).map(w => `
                                    <span class="weakness-item">
                                        ${typeof w.type === 'object' ? w.type.name : w.type} ${w.value || '×2'}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="card-detail-actions">
                        <button class="btn btn-primary" onclick="window.collectionApp.controller.addCardToDeck('${card.id}'); window.collectionApp.closeModal();">
                            ➕ Ajouter au Deck
                        </button>
                        <button class="btn btn-secondary favorite-toggle" onclick="window.collectionApp.controller.toggleFavorite('${card.id}'); window.collectionApp.closeModal();">
                            ${card.favorited ? '💔 Retirer des favoris' : '❤️ Ajouter aux favoris'}
                        </button>
                    </div>
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

    toggleSelectionMode() {
        this.isSelectionMode = !this.isSelectionMode;
        this.selectedCards.clear();
        if (this.controller) {
            this.controller.refreshView();
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
                <h2>📊 Statistiques de Collection</h2>
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
                        <div class="stat-value">${stats.favorited}</div>
                        <div class="stat-label">Favorites</div>
                    </div>
                </div>

                <h3>Répartition par type</h3>
                <div class="type-stats">
                    ${Object.entries(stats.byType).map(([type, count]) =>
                        `<div class="type-stat">
                            <span class="type-name">${type}</span>
                            <span class="type-count">${count}</span>
                        </div>`
                    ).join('')}
                </div>

                <h3>Cartes les plus utilisées</h3>
                <div class="top-cards">
                    ${stats.mostUsed.map(card =>
                        `<div class="top-card">
                            <span class="card-name">${card.name}</span>
                            <span class="usage-count">${card.timesUsed || 0}x</span>
                        </div>`
                    ).join('')}
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
