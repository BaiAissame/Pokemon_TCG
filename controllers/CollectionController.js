// controllers/CollectionController.js
import GameStateModel from '../models/GameStateModel.js';
import CardModel from '../models/CardModel.js';
import CollectionView from "../views/CollectionView.js";


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
        this.collectionView = new CollectionView();
    }

    setView(view) {
        this.view = view;
        if (view && this.gameState) {
            this.gameState.addObserver(view);
        }
    }

    refreshView() {
        if (this.onViewUpdate) {
            this.onViewUpdate();
        }
    }

    // Méthode pour exposer le deck
    getCurrentDeck() {
        return this.gameState.deck;
    }

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
        if (card && this.collectionView) {
            this.collectionView.showCardDetails(card);
        } else {
            console.error('Carte non trouvée ou vue non disponible:', cardId);
        }
    }
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

    // Méthode corrigée - utilise les méthodes existantes du GameStateModel
    createDeckFromCollection(cardIds, deckName = 'Mon Deck') {
        let addedCount = 0;
        
        cardIds.forEach(cardId => {
            if (this.gameState.addCardFromCollectionToDeck(cardId)) {
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.gameState.save();
            return true;
        }
        return false;
    }

    exportCollection() {
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            collection: this.gameState.collection,
            stats: this.getCollectionStats()
        };
    }

    // Méthode corrigée - utilise addCardsToCollection du GameStateModel
    importCollection(data) {
        if (!data.collection || !Array.isArray(data.collection)) {
            throw new Error('Format de données invalide');
        }

        const cardsToAdd = data.collection.map(cardData => {
            const card = new CardModel(cardData);
            return card;
        });

        this.gameState.addCardsToCollection(cardsToAdd);
        return true;
    }

    sortCollection(sortBy) {
        this.currentFilters.sortBy = sortBy;
        return this.searchCards(this.currentSearchQuery);
    }

    getRecommendations() {
        const stats = this.getCollectionStats();
        const recommendations = [];

        // Correction : utilise une méthode qui existe réellement
        const unusedRares = this.gameState.collection.filter(card => {
            // Vérifier si la carte est rare (basé sur la rareté)
            const isRare = card.rarity && ['Rare', 'Ultra Rare', 'Secret Rare'].includes(card.rarity.name);
            return isRare && (card.timesUsed || 0) === 0;
        });

        if (unusedRares.length > 0) {
            recommendations.push({
                type: 'unused_rares',
                title: 'Cartes rares non utilisées',
                cards: unusedRares.slice(0, 3),
                description: 'Vous avez des cartes rares que vous n\'avez jamais utilisées!'
            });
        }

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

    // Méthodes supplémentaires utiles
    getDeckSize() {
        return this.gameState.deck.length;
    }

    clearDeck() {
        this.gameState.deck = [];
        this.gameState.save();
    }

    removeCardFromDeck(cardId) {
        const cardIndex = this.gameState.deck.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            const removedCard = this.gameState.deck.splice(cardIndex, 1)[0];
            this.gameState.save();
            return removedCard;
        }
        return null;
    }

    // Méthode pour obtenir les cartes du deck avec leurs détails
    getDeckWithDetails() {
        return this.gameState.deck.map(deckCard => {
            const collectionCard = this.gameState.collection.find(c => c.id === deckCard.id);
            return {
                ...deckCard,
                timesUsed: collectionCard?.timesUsed || 0,
                favorited: collectionCard?.favorited || false
            };
        });
    }
}