// models/GameStateModel.js
import CardModel from './CardModel.js';
import TrainerModel from './TrainerModel.js';

class GameStateModel {
  constructor() {
    this.deck = [];
    this.hand = [];
    this.collection = [];
    this.lastDrawTime = null;
    this.trainers = [];
    this.selectedTrainer = null;
    this.totalCards = 0;
    this.rareCards = 0;
    this.boosters = 0;
    this.battles = 0;
    this.credits = 100;
    this.observers = [];
    this.statistics = {
      totalWins: 0,
      totalLosses: 0,
      bestWinStreak: 0,
      currentWinStreak: 0,
    };
  }

  addObserver(observer) {
    this.observers.push(observer);
  }

  notifyObservers(eventType, data) {
    this.observers.forEach((observer) => {
      if (observer[eventType]) {
        observer[eventType](data);
      }
    });
  }

  addCardsToDeck(cards) {
    this.deck.push(...cards);
    this.totalCards += cards.length;
    this.rareCards += cards.filter((card) => card.isRare()).length;

    this.addCardsToCollection(cards);

    this.save();
    this.notifyObservers("onCardsAdded", cards);
  }

  addCardsToCollection(cards) {
    cards.forEach(card => {
      const existingCard = this.collection.find(c => c.id === card.id);
      if (!existingCard) {
        const collectionCard = {
          ...card,
          addedAt: new Date().toISOString(),
          timesUsed: 0,
          favorited: false
        };
        this.collection.push(collectionCard);
      } else {
        existingCard.timesUsed = (existingCard.timesUsed || 0) + 1;
      }
    });
    this.notifyObservers("onCollectionUpdated", this.collection);
  }

  removeCardFromCollection(cardId) {
    const cardIndex = this.collection.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      const removedCard = this.collection.splice(cardIndex, 1)[0];
      this.save();
      this.notifyObservers("onCollectionUpdated", this.collection);
      return removedCard;
    }
    return null;
  }

  addCardFromCollectionToDeck(cardId) {
    const card = this.collection.find(c => c.id === cardId);
    if (card) {
      const deckCard = new CardModel(card);
      this.deck.push(deckCard);
      card.timesUsed = (card.timesUsed || 0) + 1;

      this.save();
      this.notifyObservers("onCardAddedFromCollection", { card: deckCard, from: "collection" });
      return true;
    }
    return false;
  }

  toggleCardFavorite(cardId) {
    const card = this.collection.find(c => c.id === cardId);
    if (card) {
      card.favorited = !card.favorited;
      this.save();
      this.notifyObservers("onCollectionUpdated", this.collection);
      return card.favorited;
    }
    return false;
  }

  getCollectionStats() {
    return {
      total: this.collection.length,
      rare: this.collection.filter(card => card.isRare()).length,
      favorited: this.collection.filter(card => card.favorited).length,
      byType: this.collection.reduce((acc, card) => {
        const type = card.types && card.types[0] ? card.types[0].name : 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      mostUsed: this.collection
        .sort((a, b) => (b.timesUsed || 0) - (a.timesUsed || 0))
        .slice(0, 5)
    };
  }

  searchCollection(query, filters = {}) {
    let results = [...this.collection];

    if (query) {
      results = results.filter(card =>
        card.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (filters.type) {
      results = results.filter(card =>
        card.types && card.types.some(t => t.name === filters.type)
      );
    }

    if (filters.rarity) {
      results = results.filter(card =>
        card.rarity && card.rarity.name === filters.rarity
      );
    }

    if (filters.favorited !== undefined) {
      results = results.filter(card => card.favorited === filters.favorited);
    }

    if (filters.sortBy === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'rarity') {
      const rarityOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Ultra Rare': 4, 'Secret Rare': 5 };
      results.sort((a, b) => (rarityOrder[b.rarity?.name] || 0) - (rarityOrder[a.rarity?.name] || 0));
    } else if (filters.sortBy === 'dateAdded') {
      results.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    } else if (filters.sortBy === 'timesUsed') {
      results.sort((a, b) => (b.timesUsed || 0) - (a.timesUsed || 0));
    }

    return results;
  }

  moveCardFromDeckToHand(cardId) {
    const cardIndex = this.deck.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) return false;

    const card = this.deck.splice(cardIndex, 1)[0];

    if (this.hand.length >= 7) {
      const firstHandCard = this.hand.shift();
      this.deck.push(firstHandCard);
    }

    this.hand.push(card);
    this.save();
    this.notifyObservers("onCardMoved", { from: "deck", to: "hand", card });
    return true;
  }

  moveCardFromHandToDeck(cardId) {
    const cardIndex = this.hand.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) return false;

    const card = this.hand.splice(cardIndex, 1)[0];
    this.deck.push(card);
    this.save();
    this.notifyObservers("onCardMoved", { from: "hand", to: "deck", card });
    return true;
  }

  canDrawCards() {
    if (!this.lastDrawTime) return true;
    const now = Date.now();
    const timeSinceLastDraw = now - this.lastDrawTime;
    return timeSinceLastDraw >= 5 * 60 * 1000;
  }

  getRemainingTime() {
    if (!this.lastDrawTime) return 0;
    const now = Date.now();
    const timeSinceLastDraw = now - this.lastDrawTime;
    const waitTime = 5 * 60 * 1000;
    return Math.max(0, waitTime - timeSinceLastDraw);
  }

  setLastDrawTime() {
    this.lastDrawTime = Date.now();
    this.boosters++;
    this.save();
    this.notifyObservers("onDrawTimeSet", this.lastDrawTime);
  }

  save() {
    const dataToSave = {
      deck: this.deck,
      hand: this.hand,
      collection: this.collection,
      lastDrawTime: this.lastDrawTime,
      trainers: this.trainers,
      totalCards: this.totalCards,
      rareCards: this.rareCards,
      boosters: this.boosters,
      battles: this.battles,
      credits: this.credits,
      statistics: this.statistics || {
        totalWins: 0,
        totalLosses: 0,
        bestWinStreak: 0,
        currentWinStreak: 0,
      },
    };

    try {
      window.gameStateStorage = dataToSave;
      localStorage.setItem("pokemonTCG_gameState", JSON.stringify(dataToSave));
      this.notifyObservers("onStateChange", this);
    } catch (error) {
      console.warn("Erreur de sauvegarde:", error);
    }
  }

  load() {
    let savedState = null;

    try {
      const localData = localStorage.getItem("pokemonTCG_gameState");
      if (localData) {
        savedState = JSON.parse(localData);
      }
    } catch (error) {
      console.warn("Erreur de chargement localStorage:", error);
    }

    if (!savedState) {
      savedState = window.gameStateStorage;
    }

    if (savedState) {
      Object.assign(this, savedState);

      this.deck = (this.deck || []).map((cardData) => new CardModel(cardData));
      this.hand = (this.hand || []).map((cardData) => new CardModel(cardData));
      this.collection = (this.collection || []).map((cardData) => new CardModel(cardData));

      let trainersData = this.trainers;
      if (typeof trainersData === 'string') {
        try {
          trainersData = JSON.parse(trainersData);
        } catch (error) {
          console.warn('Erreur parsing trainers:', error);
          trainersData = [];
        }
      }
      this.trainers = (trainersData || []).map(
        (trainerData) => new TrainerModel(trainerData)
      );
      this.collection = this.collection || [];
      this.statistics = this.statistics || {
        totalWins: 0,
        totalLosses: 0,
        bestWinStreak: 0,
        currentWinStreak: 0,
      };
    }
    this.notifyObservers("onStateChange", this);
  }

  updateStatistics(type, value) {
    if (!this.statistics) this.statistics = {};
    this.statistics[type] = (this.statistics[type] || 0) + value;
    this.save();
  }
}

export default GameStateModel;