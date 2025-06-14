// models/GameStateModel.js
class GameStateModel {
  constructor() {
    this.deck = [];
    this.hand = [];
    this.lastDrawTime = null;
    this.trainers = [];
    this.selectedTrainer = null;
    this.totalCards = 0;
    this.rareCards = 0;
    this.boosters = 0;
    this.battles = 0;
    this.credits = 100;
    this.observers = [];
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
    this.save();
    this.notifyObservers("onCardsAdded", cards);
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
    return timeSinceLastDraw >= 5 * 60 * 1000; // 5 minutes
  }

  getRemainingTime() {
    console.log("object");
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
      lastDrawTime: this.lastDrawTime,
      trainers: this.trainers,
      totalCards: this.totalCards,
      rareCards: this.rareCards,
      boosters: this.boosters,
      battles: this.battles,
      credits: this.credits,
    };
    window.gameStateStorage = dataToSave;
    this.notifyObservers("onStateChange", this);
  }

  load() {
    const savedState = window.gameStateStorage;
    if (savedState) {
      Object.assign(this, savedState);
      // Reconstituer les objets CardModel
      this.deck = this.deck.map((cardData) => new CardModel(cardData));
      this.hand = this.hand.map((cardData) => new CardModel(cardData));
      this.trainers = this.trainers.map(
        (trainerData) => new TrainerModel(trainerData)
      );
    }
    this.notifyObservers("onStateChange", this);
  }
}

export default GameStateModel