import GameStateModel from '../models/GameStateModel.js';
import BattleViews from '../views/BattleViews.js';
import PokemonAPIService from '../service/pokemonAPIService.js';
import CardModel from "../models/CardModel.js";
import SoundService from '../service/SoundService.js';
import AchievementService from '../service/AchievementService.js';

export default class BattleController {
    constructor(tcgdx) {
        this.gameState = new GameStateModel();
        this.battleViews = new BattleViews();
        this.pokemonAPI = new PokemonAPIService(tcgdx);
        this.soundService = new SoundService();
        this.achievementService = new AchievementService(this.gameState);
        this.selectedRating = 0;
        this.battleState = {
            inBattle: false,
            currentOpponent: null,
            playerActiveCard: null,
            opponentActiveCard: null,
            playerHP: 100,
            opponentHP: 100,
            turn: 'player', // 'player' ou 'opponent'
            battleLog: [],
            // Nouvelles propriétés
            combo: 0,
            score: 0,
            difficulty: 'normal' // 'easy', 'normal', 'hard'
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

            // Son et achievements pour le tirage
            this.soundService.playSound('cardDraw');
            this.achievementService.checkAchievements();

        } catch (error) {
            console.error('Erreur lors du tirage:', error);
            this.battleViews.onError('Erreur lors du tirage des cartes. Veuillez réessayer.');
        } finally {
            this.battleViews.showLoading(false);
        }
    }

    async drawFallbackCards() {
        this.battleViews.showLoading(true);
        try {
            const cards = this.pokemonAPI.generateFallbackCards(5);
            const cardModels = cards.map(cardData => new CardModel(cardData));
            this.gameState.addCardsToDeck(cardModels);
            this.battleViews.onCardsAdded(cards);

            // Son pour le tirage fallback
            this.soundService.playSound('cardDraw');
        } catch (error) {
            console.error('Erreur lors du tirage fallback:', error);
            this.battleViews.onError('Erreur lors du tirage des cartes fallback.');
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

    closeModal() {
        document.getElementById('cardModal').style.display = 'none';
    }

    async chooseActiveCard() {
        // Ouvre une modale pour choisir la carte active parmi la main
        if (this.gameState.hand.length === 0) {
            this.battleViews.onError("Vous n'avez aucune carte en main !");
            return;
        }
        this.battleViews.showChooseActiveModal(this.gameState.hand, (selectedCard) => {
            // Si la carte active est déjà celle-ci et qu'elle a déjà perdu des PV, ne rien faire
            if (
                this.battleState.playerActiveCard &&
                this.battleState.playerActiveCard.id === selectedCard.id &&
                this.battleState.playerHP < this.battleState.playerActiveCard.getHP()
            ) {
                this.updateBattleZone();
                this.checkAttackReady();
                return;
            }
            // Sinon, on sélectionne la carte et on initialise ses PV
            this.battleState.playerActiveCard = selectedCard;
            this.battleState.playerHP = selectedCard.getHP();
            this.updateBattleZone();
            this.checkAttackReady();

            // Son pour jouer une carte
            this.soundService.playSound('cardPlay');
        });
    }

    async chooseOpponent() {
        // Générer un adversaire aléatoire (nom et carte)
        const trainers = this.gameState.trainers.length > 0 ? this.gameState.trainers : [
            { name: 'Rival', avatar: '', rating: 3.5 }
        ];
        const randomTrainer = trainers[Math.floor(Math.random() * trainers.length)];
        this.battleState.currentOpponent = randomTrainer;
        // Générer une carte aléatoire pour l'adversaire
        const cards = await this.pokemonAPI.getRandomCards(1);
        this.battleState.opponentActiveCard = new CardModel(cards[0]);
        this.battleState.opponentHP = this.battleState.opponentActiveCard.getHP();
        this.updateBattleZone();
        this.checkAttackReady();
    }

    checkAttackReady() {
        const btn = document.getElementById('attackBtn');
        if (this.battleState.playerActiveCard && this.battleState.opponentActiveCard) {
            btn.disabled = false;
        } else {
            btn.disabled = true;
        }
    }

    attack() {
        if (!this.battleState.playerActiveCard || !this.battleState.opponentActiveCard) {
            this.battleViews.onError('Sélectionnez une carte et un adversaire !');
            return;
        }
        if (this.battleState.turn !== 'player') return;

        // Proposer toutes les attaques disponibles
        let attacks = Array.isArray(this.battleState.playerActiveCard.attacks) ? this.battleState.playerActiveCard.attacks : [];
        if (!attacks || attacks.length === 0) {
            // Ajoute une attaque basique si aucune attaque n'est trouvée
            attacks = [{ name: 'Charge', damage: 10, text: 'Attaque par défaut.' }];
        }

        this.battleViews.showChooseAttackModal(attacks, (attack) => {
            // Calcul des dégâts avec faiblesse/résistance
            let dmg = 0;
            if (typeof attack.damage === 'number') {
                dmg = attack.damage;
            } else if (typeof attack.damage === 'string') {
                const match = attack.damage.match(/\d+/);
                dmg = match ? parseInt(match[0]) : 0;
            }
            // Appliquer faiblesse/résistance
            dmg = this.applyWeaknessResistance(dmg, this.battleState.playerActiveCard, this.battleState.opponentActiveCard);
            this.battleState.opponentHP = Math.max(0, this.battleState.opponentHP - dmg);
            this.battleState.battleLog.push(`${this.battleState.playerActiveCard.name} utilise ${attack.name} pour ${dmg} dégâts !`);

            // Système de combo et sons
            this.addCombo();
            this.soundService.playSound('attack');
            if (this.battleState.combo > 1) {
                this.soundService.playSound('combo', { pitch: 1 + (this.battleState.combo * 0.1) });
            }

            // Statistiques
            this.gameState.updateStatistics('totalDamageDealt', dmg);

            this.updateBattleZone();
            if (this.battleState.opponentHP <= 0) {
                this.battleState.battleLog.push('🎉 Victoire !');
                this.gameState.credits += 50;
                this.gameState.battles++;

                // Gérer les victoires parfaites
                const perfectWin = this.battleState.playerHP === this.battleState.playerActiveCard.getHP();
                if (perfectWin) {
                    this.battleState.perfectWin = true;
                    this.battleState.battleLog.push('🛡️ Victoire parfaite !');
                }

                // Sons et achievements
                this.soundService.playSound('win');
                this.gameState.updateStatistics('totalWins', 1);
                this.gameState.updateStatistics('currentWinStreak', 1);
                this.achievementService.checkAchievements(this.battleState);

                this.updateBattleZone();
                this.resetCombo();
                return;
            }
            this.battleState.turn = 'opponent';
            setTimeout(() => this.opponentAttack(), 1200);
        });
    }

    applyWeaknessResistance(dmg, attacker, defender) {
        // Applique les faiblesses/résistances simples (x2 ou -20)
        let finalDmg = dmg;
        if (defender.weaknesses && defender.weaknesses.length > 0 && attacker.types && attacker.types.length > 0) {
            const atkType = attacker.types[0].name || attacker.types[0];
            const weak = defender.weaknesses.find(w => w.type && (w.type.name === atkType || w.type === atkType));
            if (weak && weak.value && weak.value.includes('2')) finalDmg *= 2;
        }
        if (defender.resistances && defender.resistances.length > 0 && attacker.types && attacker.types.length > 0) {
            const atkType = attacker.types[0].name || attacker.types[0];
            const res = defender.resistances.find(r => r.type && (r.type.name === atkType || r.type === atkType));
            if (res && res.value && res.value.includes('20')) finalDmg = Math.max(0, finalDmg - 20);
        }
        return finalDmg;
    }

    opponentAttack() {
        if (!this.battleState.opponentActiveCard) return;
        let attacks = Array.isArray(this.battleState.opponentActiveCard.attacks) ? this.battleState.opponentActiveCard.attacks : [];
        if (!attacks || attacks.length === 0) {
            attacks = [{ name: 'Charge', damage: 10, text: 'Attaque par défaut.' }];
        }
        // L'IA choisit une attaque aléatoire
        const attack = attacks[Math.floor(Math.random() * attacks.length)];
        let dmg = 0;
        if (attack) {
            if (typeof attack.damage === 'number') {
                dmg = attack.damage;
            } else if (typeof attack.damage === 'string') {
                const match = attack.damage.match(/\d+/);
                dmg = match ? parseInt(match[0]) : 0;
            }
        }
        dmg = this.applyWeaknessResistance(dmg, this.battleState.opponentActiveCard, this.battleState.playerActiveCard);
        this.battleState.playerHP = Math.max(0, this.battleState.playerHP - dmg);
        this.battleState.battleLog.push(`${this.battleState.opponentActiveCard.name} utilise ${attack ? attack.name : 'Attaque'} pour ${dmg} dégâts !`);
        this.updateBattleZone();
        if (this.battleState.playerHP <= 0) {
            this.battleState.battleLog.push('💀 Défaite...');

            // Sons et stats pour défaite
            this.soundService.playSound('lose');
            this.gameState.updateStatistics('totalLosses', 1);
            this.gameState.statistics.currentWinStreak = 0; // Reset win streak
            this.resetCombo();

            this.updateBattleZone();
            return;
        }
        this.battleState.turn = 'player';
    }

    updateBattleZone() {
        this.battleViews.updateBattleZone(this.battleState);
    }

    // Nouveau système de combo et score
    addCombo() {
        this.battleState.combo++;
        const bonusPoints = this.battleState.combo * 10;
        this.battleState.score += bonusPoints;
        if (this.battleState.combo > 1) {
            this.battleState.battleLog.push(`🔥 Combo x${this.battleState.combo}! +${bonusPoints} points!`);
        }
    }

    resetCombo() {
        this.battleState.combo = 0;
    }

    // Difficulté adaptative
    adjustDifficulty() {
        const winRate = this.gameState.battles > 0 ? (this.gameState.credits - 100) / (this.gameState.battles * 50) : 0;

        if (winRate > 0.8) {
            this.battleState.difficulty = 'hard';
        } else if (winRate < 0.3) {
            this.battleState.difficulty = 'easy';
        } else {
            this.battleState.difficulty = 'normal';
        }
    }
}