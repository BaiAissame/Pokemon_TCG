import GameStateModel from '../models/GameStateModel.js';
import GameView from '../views/GameView.js';
import PokemonTCGAPIService from '../service/PokemonTCGAPIService.js';
import TrainerModel from '../models/TrainerModel.js';
import BoosterService from '../service/BoosterService.js';
import CardAnimationService from '../service/CardAnimationService.js';
import SoundService from '../service/SoundService.js';
import AchievementService from '../service/AchievementService.js';
import CardModel from "../models/CardModel.js";

class GameController {
    constructor() {
        this.gameState = new GameStateModel();
        this.gameView = new GameView();
        this.pokemonAPI = new PokemonTCGAPIService();
        this.soundService = new SoundService();
        this.achievementService = new AchievementService(this.gameState);
        this.boosterService = new BoosterService(this.pokemonAPI, this.soundService);
        this.animationService = new CardAnimationService();
        this.selectedRating = 0;
        this.selectedBoosterType = 'standard';

        this.gameState.addObserver(this.gameView);

        this.init();
    }

    async init() {
        this.gameState.load();
        this.generateTrainers();
        this.startTimer();
        this.initializeBoosterInterface();

        if (this.gameState.deck.length === 0 && this.gameState.hand.length === 0) {
            await this.drawCards();
        }
    }

    generateTrainers(regenerate = false) {
        const trainerNames = [
            'Sacha Ketchup', 'Ondine', 'Pierre Rochard', 'Team Rocket',
            'Prof. Chen', 'Régis', 'Flora', 'Max Sterling',
            'Cynthia', 'Champion Red', 'Blue Oak', 'Léo'
        ];

        const trainers = trainerNames.map((name, index) => new TrainerModel({
            id: index + 1,
            name,
            rating: (Math.random() * 5).toFixed(1),
            battles: Math.floor(Math.random() * 100),
            online: Math.random() > 0.3
        }));

        if (regenerate) localStorage.setItem('trainers', JSON.stringify(trainers));
        if (!localStorage.getItem('trainers')) localStorage.setItem('trainers', JSON.stringify(trainers));

        const trainersData = localStorage.getItem('trainers');
        this.gameState.trainers = trainersData ? JSON.parse(trainersData) : trainers;
        this.gameState.save();

        this.gameState.notifyObservers('onStateChange', this.gameState);
    }

    refreshTrainers() {
        this.generateTrainers(true);
        this.gameView.showMessage('Liste des dresseurs actualisée!', 'success');
    }

    selectTrainer(trainer, element) {
        document.querySelectorAll('.trainer-card').forEach(el => el.classList.remove('selected'));
        if (element) element.classList.add('selected');

        this.gameState.selectedTrainer = trainer;
        this.gameView.showTrainerModal(trainer);
    }

    setSelectedRating(rating) {
        this.selectedRating = rating;
    }

    submitTrainerFeedback() {
        const comment = document.getElementById('commentInput').value;
        const trainer = this.gameState.selectedTrainer;

        if (!trainer) return;

        if (comment.trim() === '') {
            this.gameView.onError('Veuillez saisir un commentaire.');
            return;
        }

        if (this.selectedRating === 0) {
            this.gameView.onError('Veuillez sélectionner une note.');
            return;
        }

        trainer.addComment(comment, this.selectedRating);
        this.gameState.battles++;
        this.gameState.save();

        document.getElementById('commentInput').value = '';
        this.gameView.setRating(0);
        this.selectedRating = 0;

        this.gameView.closeTrainerModal();
        this.gameView.showMessage(`Commentaire envoyé à ${trainer.name}!`, 'success');
    }

    closeModal() {
        this.gameView.closeModal();
    }

    closeTrainerModal() {
        this.gameView.closeTrainerModal();
    }

    startTimer() {
        setInterval(() => {
            this.gameView.updateTimer(this.gameState);
        }, 1000);
    }

    initializeBoosterInterface() {
        this.gameView.createBoosterInterface();
        this.updateBoosterSelection();
    }

    updateBoosterSelection() {
        const boosters = this.boosterService.getAvailableBoosters(this.gameState.credits);
        this.gameView.updateBoosterSelection(boosters, this.selectedBoosterType);
        this.gameView.updateCreditsDisplay(this.gameState.credits);
    }

    selectBoosterType(boosterType) {
        this.selectedBoosterType = boosterType;
        this.updateBoosterSelection();
    }

    async drawCards() {
        await this.openBooster(this.selectedBoosterType);
    }

    async openBooster(boosterType = 'standard') {
        if (boosterType === 'standard' && !this.gameState.canDrawCards()) {
            this.gameView.onError('Vous devez attendre 5 minutes entre chaque tirage standard!');
            return;
        }

        const boosterConfig = this.boosterService.boosterTypes[boosterType];
        if (this.gameState.credits < boosterConfig.price) {
            this.gameView.onError(`Crédits insuffisants! Il vous faut ${boosterConfig.price} crédits.`);
            return;
        }

        this.gameView.showLoading(true);

        try {
            const result = await this.boosterService.openBooster(boosterType, this.gameState);

            await this.animationService.playBoosterOpenAnimation(boosterType, result.cards);

            this.gameView.showBoosterResult ? this.gameView.showBoosterResult(result) : console.log('showBoosterResult non disponible dans GameView');

            const cardModels = result.cards.map(cardData => new CardModel(cardData));
            this.gameState.addCardsToDeck(cardModels);

            if (boosterType === 'standard') {
                this.gameState.setLastDrawTime();
            }

            this.gameState.boosters++;

            this.achievementService.checkAchievements();

            if (result.specialEffects.length > 0) {
                this.handleSpecialEffects(result.specialEffects);
            }

            this.gameState.save();
            this.updateBoosterSelection();

            const rareCount = result.cards.filter(card => card.rarity?.name !== 'Common' && card.rarity?.name !== 'Uncommon').length;
            let message = `🎉 ${boosterConfig.name} ouvert! ${result.cards.length} cartes obtenues`;
            if (rareCount > 0) {
                message += ` dont ${rareCount} carte${rareCount > 1 ? 's' : ''} rare${rareCount > 1 ? 's' : ''}!`;
            }

            this.gameView.showMessage(message, 'success');

        } catch (error) {
            console.error('Erreur lors de l\'ouverture du booster:', error);
            this.gameView.onError('Erreur lors de l\'ouverture du booster. Veuillez réessayer.');
        } finally {
            this.gameView.showLoading(false);
        }
    }

    handleSpecialEffects(effects) {
        effects.forEach(effect => {
            switch (effect) {
                case 'multiRare':
                    this.animationService.playComboEffect('tripleRare');
                    this.soundService.playSound('combo');
                    break;
                case 'secretRare':
                    this.animationService.playComboEffect('secretCombo');
                    this.soundService.playSound('secretRare');
                    break;
                case 'legendary':
                    this.soundService.playSound('legendary');
                    break;
                case 'mystery':
                    this.soundService.playSound('mystery');
                    break;
            }
        });
    }

    moveCardToHand(cardId) {
        this.gameState.moveCardFromDeckToHand(cardId);
    }

    moveCardToDeck(cardId) {
        this.gameState.moveCardFromHandToDeck(cardId);
    }

    showCardDetails(card) {
        this.gameView.showCardDetails(card);
    }

    addCardsToDeck(cards) {
        try {
            const cardModels = cards.map(cardData => new CardModel(cardData));
            this.gameState.addCardsToDeck(cardModels);
            this.gameState.save();
            this.updateBoosterSelection();

            this.gameView.showMessage(`🎉 ${cards.length} cartes ajoutées au deck !`, 'success');
        } catch (error) {
            console.error('Erreur lors de l\'ajout des cartes:', error);
            this.gameView.onError('Erreur lors de l\'ajout des cartes au deck.');
        }
    }
}

export default GameController;
