// controllers/CollectionController.js
import GameStateModel from '../models/GameStateModel.js';
import CardModel from '../models/CardModel.js';

export default class CollectionController {
    constructor(gameState) {
        this.gameState = gameState || new GameStateModel();
        this.currentFilters = {
            type: null,
            rarity: null,
            favorited: null,
            sortBy: 'dateAdded'
        };
        this.currentSearchQuery = '';
        this.view = null;
        this.onViewUpdate = null;
        this.onCardAdded = null;
        this.onCardRemoved = null;
        this.onFavoriteToggled = null;
    }

    setView(view) {
        this.view = view;
    }

    refreshView() {
        if (this.onViewUpdate) {
            this.onViewUpdate();
        }
    }

    // Méthodes de recherche et filtrage
    searchCards(query = '') {
        this.currentSearchQuery = query;
        return this.gameState.searchCollection(query, this.currentFilters);
    }

    setFilter(filterType, value) {
        this.currentFilters[filterType] = value;
        const results = this.searchCards(this.currentSearchQuery);
        this.refreshView();
        return results;
    }

    clearFilters() {
        this.currentFilters = {
            type: null,
            rarity: null,
            favorited: null,
            sortBy: 'dateAdded'
        };
        this.currentSearchQuery = '';
        return this.gameState.collection;
    }

    // Méthodes de gestion des cartes
    addCardToDeck(cardId) {
        const success = this.gameState.addCardFromCollectionToDeck(cardId);
        if (success && this.onCardAdded) {
            const card = this.gameState.collection.find(c => c.id === cardId);
            this.onCardAdded(card);
        }
        return success;
    }

    addMultipleCardsToDeck(cardIds) {
        let addedCount = 0;
        cardIds.forEach(cardId => {
            if (this.gameState.addCardFromCollectionToDeck(cardId)) {
                addedCount++;
            }
        });

        if (addedCount > 0 && this.view) {
            this.view.showMessage(`${addedCount} carte(s) ajoutée(s) au deck!`, 'success');
        }

        return addedCount;
    }

    removeCardFromCollection(cardId) {
        const removedCard = this.gameState.removeCardFromCollection(cardId);
        if (removedCard && this.onCardRemoved) {
            this.onCardRemoved(removedCard);
        }
        this.refreshView();
        return removedCard;
    }

    toggleFavorite(cardId) {
        const favorited = this.gameState.toggleCardFavorite(cardId);
        if (this.onFavoriteToggled) {
            const card = this.gameState.collection.find(c => c.id === cardId);
            this.onFavoriteToggled(card, favorited);
        }
        this.refreshView();
        return favorited;
    }

    showCardDetails(cardId) {
        const card = this.gameState.collection.find(c => c.id === cardId);
        if (card && this.view) {
            // Utiliser la même méthode que BattleViews pour l'affichage
            this.view.showCardDetails(card);
        }
    }

    // Méthodes utilitaires
    getCollectionStats() {
        return this.gameState.getCollectionStats();
    }

    getAvailableTypes() {
        const types = new Set();
        this.gameState.collection.forEach(card => {
            if (card.types) {
                card.types.forEach(type => types.add(type.name));
            }
        });
        return Array.from(types).sort();
    }

    getAvailableRarities() {
        const rarities = new Set();
        this.gameState.collection.forEach(card => {
            if (card.rarity) {
                rarities.add(card.rarity.name);
            }
        });
        return Array.from(rarities).sort();
    }

    // Méthodes pour construire des decks
    createDeckFromCollection(cardIds, deckName = 'Mon Deck') {
        const selectedCards = cardIds.map(id =>
            this.gameState.collection.find(card => card.id === id)
        ).filter(card => card !== undefined);

        if (selectedCards.length === 0) {
            return false;
        }

        // Ajouter les cartes au deck actuel
        selectedCards.forEach(card => {
            const deckCard = new CardModel(card);
            this.gameState.deck.push(deckCard);
            // Mettre à jour les statistiques d'utilisation
            card.timesUsed = (card.timesUsed || 0) + 1;
        });

        this.gameState.save();
        return true;
    }

    // Exporter/Importer la collection
    exportCollection() {
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            collection: this.gameState.collection,
            stats: this.getCollectionStats()
        };
    }

    importCollection(data) {
        if (!data.collection || !Array.isArray(data.collection)) {
            throw new Error('Format de données invalide');
        }

        // Fusionner avec la collection existante
        data.collection.forEach(cardData => {
            const existingCard = this.gameState.collection.find(c => c.id === cardData.id);
            if (!existingCard) {
                const card = new CardModel(cardData);
                card.addedAt = cardData.addedAt || new Date().toISOString();
                card.timesUsed = cardData.timesUsed || 0;
                card.favorited = cardData.favorited || false;
                this.gameState.collection.push(card);
            }
        });

        this.gameState.save();
        return true;
    }

    // Méthodes de tri avancé
    sortCollection(sortBy) {
        this.currentFilters.sortBy = sortBy;
        return this.searchCards(this.currentSearchQuery);
    }

    // Obtenir des recommandations basées sur l'utilisation
    getRecommendations() {
        const stats = this.getCollectionStats();
        const recommendations = [];

        // Cartes populaires non utilisées
        const unusedRares = this.gameState.collection.filter(card =>
            card.isRare() && (card.timesUsed || 0) === 0
        );

        if (unusedRares.length > 0) {
            recommendations.push({
                type: 'unused_rares',
                title: 'Cartes rares non utilisées',
                cards: unusedRares.slice(0, 3),
                description: 'Vous avez des cartes rares que vous n\'avez jamais utilisées!'
            });
        }

        // Cartes favorites pour le deck
        const favorites = this.gameState.collection.filter(card => card.favorited);
        if (favorites.length > 0) {
            recommendations.push({
                type: 'favorites',
                title: 'Construire un deck avec vos favorites',
                cards: favorites.slice(0, 5),
                description: 'Créez un deck avec vos cartes préférées!'
            });
        }

        return recommendations;
    }
}
