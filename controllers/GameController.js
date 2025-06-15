import GameStateModel from '../models/GameStateModel.js';
import GameView from '../views/GameView.js';
import PokemonAPIService from '../service/pokemonAPIService.js';
import TrainerModel from '../models/TrainerModel.js';

class GameController {
    constructor(tcgdx) {
        this.gameState = new GameStateModel();
        this.gameView = new GameView();
        this.pokemonAPI = new PokemonAPIService(tcgdx);
        this.selectedRating = 0;

        // Observer pattern
        this.gameState.addObserver(this.gameView);

        this.init();
    }

    async init() {
        this.gameState.load();
        this.generateTrainers();
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

        // Parser la chaîne JSON pour obtenir les objets trainers
        const trainersData = localStorage.getItem('trainers');
        this.gameState.trainers = trainersData ? JSON.parse(trainersData) : trainers;
        this.gameState.save();

        // Notifier les observateurs du changement
        this.gameState.notifyObservers('onStateChange', this.gameState);
    }

    refreshTrainers() {
        this.generateTrainers(true);
        this.gameView.showMessage('Liste des dresseurs actualisée!', 'success');
    }

    selectTrainer(trainer, element) {
        // Sélection visuelle
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

        // Reset du formulaire
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
}

export default GameController;
