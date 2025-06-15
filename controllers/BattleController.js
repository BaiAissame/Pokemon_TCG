import GameStateModel from '../models/GameStateModel.js';
import BattleViews from '../views/BattleViews.js';
import PokemonAPIService from '../service/pokemonAPIService.js';
import CardModel from "../models/CardModel.js";

export default class BattleController {
    constructor(tcgdx) {
        this.gameState = new GameStateModel();
        this.battleViews = new BattleViews();
        this.pokemonAPI = new PokemonAPIService(tcgdx);
        this.selectedRating = 0;
        this.battleState = {
            inBattle: false,
            currentOpponent: null,
            playerActiveCard: null,
            opponentActiveCard: null,
            playerHP: 100,
            opponentHP: 100,
            turn: 'player', // 'player' ou 'opponent'
            battleLog: []
        };
        this.gameState.addObserver(this.battleViews);
        this.init();
    }

    async init() {
        this.gameState.load();
        this.startTimer();

        // Charger quelques cartes au démarrage si aucune carte
        if (this.gameState.deck.length === 0 && this.gameState.hand.length === 0) {
            await this.drawCards();
        }
    }

    startTimer() {
        setInterval(() => {
            this.battleViews.updateTimer(this.gameState);
        }, 1000);
    }

    async drawCards() {
        if (!this.gameState.canDrawCards()) {
            this.battleViews.onError('Vous devez attendre 5 minutes entre chaque tirage!');
            return;
        }

        this.battleViews.showLoading(true);

        try {
            const cards = await this.pokemonAPI.getRandomCards(5);
            const cardModels = cards.map(cardData => new CardModel(cardData));
            this.gameState.addCardsToDeck(cardModels);
            this.gameState.setLastDrawTime();

        } catch (error) {
            console.error('Erreur lors du tirage:', error);
            this.battleViews.onError('Erreur lors du tirage des cartes. Veuillez réessayer.');
        } finally {
            this.battleViews.showLoading(false);
        }
    }

    moveCardToHand(cardId) {
        this.gameState.moveCardFromDeckToHand(cardId);
    }

    moveCardToDeck(cardId) {
        this.gameState.moveCardFromHandToDeck(cardId);
    }

    showCardDetails(card) {
        this.battleViews.showCardDetails(card);
    }
}