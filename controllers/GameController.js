import TrainerModel from '../models/TrainerModel.js';
import GameStateModel from '../models/GameStateModel.js';
import GameView from '../views/GameView.js';
import PokemonAPIService from '../service/pokemonAPIService.js';
// import CardModel from "../models/CardModel.js";
class GameController {
    constructor(tcgdx) {
        this.gameState = new GameStateModel();
        this.gameView = new GameView();
        this.pokemonAPI = new PokemonAPIService(tcgdx);
        // this.selectedRating = 0;
        // this.battleState = {
        //     inBattle: false,
        //     currentOpponent: null,
        //     playerActiveCard: null,
        //     opponentActiveCard: null,
        //     playerHP: 100,
        //     opponentHP: 100,
        //     turn: 'player', // 'player' ou 'opponent'
        //     battleLog: []
        // };

        // Observer pattern
        this.gameState.addObserver(this.gameView);

        this.init();
    }

    async init() {
        this.gameState.load();
        this.generateTrainers();
        // this.startTimer();

        // Charger quelques cartes au démarrage si aucune carte
        // if (this.gameState.deck.length === 0 && this.gameState.hand.length === 0) {
        //     await this.drawCards();
        // }
    }

    // startTimer() {
    //     setInterval(() => {
    //         this.gameView.updateTimer(this.gameState);
    //     }, 1000);
    // }

    // async drawCards() {
    //     if (!this.gameState.canDrawCards()) {
    //         this.gameView.onError('Vous devez attendre 5 minutes entre chaque tirage!');
    //         return;
    //     }

    //     this.gameView.showLoading(true);

    //     try {
    //         const cards = await this.pokemonAPI.getRandomCards(5);
    //         const cardModels = cards.map(cardData => new CardModel(cardData));

    //         this.gameState.addCardsToDeck(cardModels);
    //         this.gameState.setLastDrawTime();

    //     } catch (error) {
    //         console.error('Erreur lors du tirage:', error);
    //         this.gameView.onError('Erreur lors du tirage des cartes. Veuillez réessayer.');
    //     } finally {
    //         this.gameView.showLoading(false);
    //     }
    // }

    // moveCardToHand(cardId) {
    //     this.gameState.moveCardFromDeckToHand(cardId);
    // }

    // moveCardToDeck(cardId) {
    //     this.gameState.moveCardFromHandToDeck(cardId);
    // }

    // showCardDetails(card) {
    //     this.gameView.showCardDetails(card);
    // }

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
        if (regenerate) localStorage.setItem('trainers', JSON.stringify(trainers))
        if (!localStorage.getItem('trainers')) localStorage.setItem('trainers', JSON.stringify(trainers));
        this.gameState.trainers = localStorage.getItem('trainers');
        // this.gameState.trainers = trainers;
        this.gameState.save();
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

    // === NOUVEAU SYSTÈME DE COMBAT ===

    // challengeTrainer(trainer) {
    //     if (this.gameState.hand.length === 0) {
    //         this.gameView.onError('Vous devez avoir au moins une carte en main pour combattre!');
    //         return;
    //     }

    //     this.battleState.inBattle = true;
    //     this.battleState.currentOpponent = trainer;
    //     this.battleState.playerHP = 100;
    //     this.battleState.opponentHP = 100;
    //     this.battleState.turn = 'player';
    //     this.battleState.battleLog = [`Combat contre ${trainer.name} commencé!`];

    //     // Générer une carte pour l'adversaire
    //     this.generateOpponentCard();

    //     this.gameView.showBattleArena(this.battleState);
    // }

    // async generateOpponentCard() {
    //     try {
    //         const opponentCards = await this.pokemonAPI.getRandomCards(1);
    //         this.battleState.opponentActiveCard = new CardModel(opponentCards[0]);
    //     } catch (error) {
    //         // Fallback avec une carte générée
    //         this.battleState.opponentActiveCard = new CardModel({
    //             id: 'opponent-fallback',
    //             name: 'Pikachu Adverse',
    //             hp: Math.floor(Math.random() * 100) + 80,
    //             attacks: [{
    //                 name: 'Éclair',
    //                 damage: Math.floor(Math.random() * 50) + 30
    //             }],
    //             types: [{ name: 'Lightning' }],
    //             image: 'https://api.dicebear.com/7.x/bottts/svg?seed=opponent&backgroundColor=yellow'
    //         });
    //     }
    // }

    selectBattleCard(card) {
        if (!this.battleState.inBattle || this.battleState.turn !== 'player') {
            return;
        }

        this.battleState.playerActiveCard = card;
        this.gameView.updateBattleArena(this.battleState);
    }

    playerAttack() {
        if (!this.battleState.playerActiveCard || this.battleState.turn !== 'player') {
            this.gameView.onError('Sélectionnez une carte pour attaquer!');
            return;
        }

        const damage = this.battleState.playerActiveCard.getAttackPower() || 25;
        this.battleState.opponentHP = Math.max(0, this.battleState.opponentHP - damage);

        this.battleState.battleLog.push(
            `${this.battleState.playerActiveCard.name} attaque pour ${damage} dégâts!`
        );

        if (this.battleState.opponentHP <= 0) {
            this.endBattle(true);
            return;
        }

        this.battleState.turn = 'opponent';
        this.gameView.updateBattleArena(this.battleState);

        // Tour de l'adversaire après un délai
        setTimeout(() => {
            this.opponentAttack();
        }, 1500);
    }

    opponentAttack() {
        if (!this.battleState.opponentActiveCard) return;

        const damage = this.battleState.opponentActiveCard.getAttackPower() || 20;
        this.battleState.playerHP = Math.max(0, this.battleState.playerHP - damage);

        this.battleState.battleLog.push(
            `${this.battleState.opponentActiveCard.name} attaque pour ${damage} dégâts!`
        );

        if (this.battleState.playerHP <= 0) {
            this.endBattle(false);
            return;
        }

        this.battleState.turn = 'player';
        this.gameView.updateBattleArena(this.battleState);
    }

    endBattle(playerWon) {
        this.battleState.inBattle = false;
        this.gameState.battles++;

        if (playerWon) {
            this.gameState.credits += 50;
            this.battleState.battleLog.push('🎉 Victoire! Vous gagnez 50 crédits!');
            this.gameView.showMessage('Victoire! +50 crédits', 'success');
        } else {
            this.battleState.battleLog.push('💀 Défaite... Réessayez!');
            this.gameView.showMessage('Défaite... Réessayez!', 'error');
        }

        this.gameState.save();
        this.gameView.updateBattleArena(this.battleState);

        // Fermer l'arène après 3 secondes
        setTimeout(() => {
            this.gameView.hideBattleArena();
        }, 3000);
    }

    surrenderBattle() {
        if (this.battleState.inBattle) {
            this.endBattle(false);
        }
    }

    // === FIN SYSTÈME DE COMBAT ===

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

    // Dans votre GameController, ajoutez cette méthode
    startBattle(trainerName) {
        // Vérifier si le joueur a des cartes
        if (this.gameState.hand.length === 0) {
            this.gameView.onError(
                "Vous devez avoir des cartes en main pour combattre!"
            );
            return;
        }

        // Trouver le dresseur
        const opponent = this.gameState.trainers.find(t => t.name === trainerName);
        if (!opponent) {
            this.gameView.onError('Dresseur introuvable!');
            return;
        }

        // Initialiser l'état de combat
        this.battleState = {
            inBattle: true,
            opponent: opponent,
            playerCard: null,
            opponentCard: null,
            playerHP: 100,
            opponentHP: 100
        };

        // Lancer l'interface de combat
        this.gameView.launchBattle();

        // Générer une carte pour l'adversaire
        this.generateOpponentCard();

        this.gameView.showMessage(`Combat contre ${trainerName} commencé!`, 'success');
    }

    // async generateOpponentCard() {
    //     try {
    //         // Essayer de récupérer une vraie carte
    //         const cards = await this.pokemonAPI.getRandomCards(1);
    //         this.battleState.opponentCard = new CardModel(cards[0]);
    //     } catch (error) {
    //         // Carte de fallback si l'API échoue
    //     }

    //     // Afficher la carte de l'adversaire
    //     this.showOpponentCard();
    // }

    showOpponentCard() {
        const opponentCardEl = document.getElementById('opponentActiveCard');

        if (opponentCardEl && this.battleState.opponentCard) {
            const card = this.battleState.opponentCard;
            opponentCardEl.innerHTML = `
          <div class="card-info">
                        ${card.image
                    ? `<img src="${card.image}" alt="${card.name}"  style="max-width:200px">`
                    : ""
                }
          </div>
      `;
        }
    }

    playerAttack() {
        if (!this.battleState.inBattle || !this.selectedBattleCard) {
            this.gameView.onError('Sélectionnez une carte pour attaquer!');
            return;
        }

        const playerDamage = this.selectedBattleCard.getAttackPower() || 25;
        this.battleState.opponentHP = Math.max(0, this.battleState.opponentHP - playerDamage);

        this.gameView.showMessage(`Vous attaquez pour ${playerDamage} dégâts!`, 'success');

        // Vérifier si l'adversaire est vaincu
        if (this.battleState.opponentHP <= 0) {
            this.endBattle(true);
            return;
        }

        // Tour de l'adversaire
        setTimeout(() => {
            this.opponentAttack();
        }, 1500);
    }


}

export default GameController

// Service API Pokemon utilisant les VRAIES méthodes du SDK TCGdx
// class PokemonAPIService {
//     constructor(tcgdx) {
//         // Initialisation du SDK TCGdx 
//         this.tcgdx = tcgdx;
//         this.cache = new Map();
//         this.availableSets = [];
//         this.availableSeries = [];
//         this.initData();
//     }

//     async initData() {
//         try {
//             // Charger les sets et séries disponibles avec les vraies méthodes
//             this.availableSets = await this.tcgdx.fetchSets();
//             this.availableSeries = await this.tcgdx.fetchSeries();
//         } catch (error) {
//             console.warn('Erreur lors du chargement des données:', error);
//             this.availableSets = [];
//             this.availableSeries = [];
//         }
//     }

//     async getRandomCards(count = 5) {
//         try {
//             // Méthode 1: Récupérer des cartes d'un set aléatoire
//             if (this.availableSets.length > 0) {
//                 const cards = await this.getCardsFromRandomSet(count);
//                 if (cards && cards.length > 0) {
//                     return cards;
//                 }
//             }

//             // Méthode 2: Récupération directe de cartes avec fetchCards
//             const cards = await this.getCardsDirectly(count);
//             if (cards && cards.length > 0) {
//                 return cards;
//             }

//             // Méthode 3: Fallback si tout échoue
//             return this.generateFallbackCards(count);

//         } catch (error) {
//             console.warn('Erreur API TCGdx, utilisation du fallback:', error);
//             return this.generateFallbackCards(count);
//         }
//     }

//     async getCardsFromRandomSet(count) {
//         try {
//             // Sélectionner un set aléatoire
//             const randomSet = this.availableSets[Math.floor(Math.random() * Math.min(this.availableSets.length, 20))];

//             // Récupérer les détails du set avec fetchSet
//             const setWithCards = await this.tcgdx.fetchSet(randomSet.id);

//             if (!setWithCards.cards || setWithCards.cards.length === 0) {
//                 throw new Error('Aucune carte dans ce set');
//             }

//             // Sélectionner des cartes aléatoires du set
//             const selectedCards = [];
//             const availableCards = [...setWithCards.cards]; // Copie pour éviter mutation

//             for (let i = 0; i < Math.min(count, availableCards.length); i++) {
//                 const randomIndex = Math.floor(Math.random() * availableCards.length);
//                 const card = availableCards[randomIndex];

//                 selectedCards.push({
//                     ...card,
//                     id: `${card.id}-${Date.now()}-${i}` // ID unique
//                 });

//                 // Éviter les doublons
//                 availableCards.splice(randomIndex, 1);
//             }

//             return selectedCards;

//         } catch (error) {
//             console.warn('Erreur getCardsFromRandomSet:', error);
//             throw error;
//         }
//     }

//     async getCardsDirectly(count) {
//         try {

//             // Récupérer toutes les cartes (sans paramètre)
//             const cards = await this.tcgdx.fetchCards();

//             if (!cards || cards.length === 0) {
//                 throw new Error('Aucune carte trouvée');
//             }

//             // Sélectionner des cartes aléatoires
//             const selectedCards = [];
//             for (let i = 0; i < Math.min(count, cards.length); i++) {
//                 const randomIndex = Math.floor(Math.random() * cards.length);
//                 const card = cards[randomIndex];

//                 selectedCards.push({
//                     ...card,
//                     id: `${card.id}-${Date.now()}-${i}`
//                 });
//             }

//             return selectedCards;

//         } catch (error) {
//             console.warn('Erreur getCardsDirectly:', error);
//             throw error;
//         }
//     }

//     async getCardById(cardId) {
//         try {
//             // Récupérer une carte spécifique avec fetchCard
//             const card = await this.tcgdx.fetchCard(cardId);
//             return card;
//         } catch (error) {
//             console.error('Erreur lors de la récupération de la carte:', error);
//             return null;
//         }
//     }

//     async getRandomCardFromSpecificSet(setId) {
//         try {
//             const setData = await this.tcgdx.fetchSet(setId);

//             if (!setData.cards || setData.cards.length === 0) {
//                 return null;
//             }

//             const randomCard = setData.cards[Math.floor(Math.random() * setData.cards.length)];
//             return {
//                 ...randomCard,
//                 id: `${randomCard.id}-${Date.now()}`
//             };

//         } catch (error) {
//             console.error('Erreur getRandomCardFromSpecificSet:', error);
//             return null;
//         }
//     }

//     async getCardsFromSerie(serieId, count = 5) {
//         try {
//             const serieData = await this.tcgdx.fetchSerie(serieId);

//             if (!serieData.sets || serieData.sets.length === 0) {
//                 throw new Error('Aucun set dans cette série');
//             }

//             // Prendre un set aléatoire de la série
//             const randomSet = serieData.sets[Math.floor(Math.random() * serieData.sets.length)];
//             const setData = await this.tcgdx.fetchSet(randomSet.id);

//             if (!setData.cards || setData.cards.length === 0) {
//                 throw new Error('Aucune carte dans ce set');
//             }

//             // Sélectionner des cartes aléatoires
//             const selectedCards = [];
//             for (let i = 0; i < Math.min(count, setData.cards.length); i++) {
//                 const randomIndex = Math.floor(Math.random() * setData.cards.length);
//                 const card = setData.cards[randomIndex];

//                 selectedCards.push({
//                     ...card,
//                     id: `${card.id}-${Date.now()}-${i}`
//                 });
//             }

//             return selectedCards;

//         } catch (error) {
//             console.warn('Erreur getCardsFromSerie:', error);
//             throw error;
//         }
//     }

//     generateFallbackCards(count) {
//         const pokemonNames = [
//             'Pikachu', 'Charizard', 'Blastoise', 'Venusaur', 'Mewtwo', 'Mew',
//             'Articuno', 'Zapdos', 'Moltres', 'Dragonite', 'Alakazam', 'Gengar',
//             'Machamp', 'Golem', 'Lapras', 'Eevee', 'Vaporeon', 'Jolteon',
//             'Flareon', 'Snorlax', 'Gyarados', 'Scyther', 'Electabuzz', 'Magmar',
//             'Psyduck', 'Golduck', 'Machop', 'Machoke', 'Tentacool', 'Tentacruel',
//             'Magikarp', 'Ditto', 'Porygon', 'Aerodactyl', 'Jinx', 'Onix'
//         ];

//         const types = [
//             { name: 'Grass' }, { name: 'Fire' }, { name: 'Water' },
//             { name: 'Lightning' }, { name: 'Psychic' }, { name: 'Fighting' },
//             { name: 'Darkness' }, { name: 'Metal' }, { name: 'Fairy' },
//             { name: 'Dragon' }, { name: 'Colorless' }
//         ];

//         const rarities = [
//             { name: 'Common' }, { name: 'Uncommon' }, { name: 'Rare' },
//             { name: 'Ultra Rare' }, { name: 'Secret Rare' }
//         ];

//         const sets = [
//             { name: 'Base Set', id: 'base1' },
//             { name: 'Jungle', id: 'jungle' },
//             { name: 'Fossil', id: 'fossil' },
//             { name: 'Team Rocket', id: 'teamrocket' },
//             { name: 'Gym Heroes', id: 'gymheroes' },
//             { name: 'Neo Genesis', id: 'neogenesis' }
//         ];

//         const cards = [];
//         for (let i = 0; i < count; i++) {
//             const name = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
//             const type = types[Math.floor(Math.random() * types.length)];
//             const rarity = rarities[Math.floor(Math.random() * rarities.length)];
//             const set = sets[Math.floor(Math.random() * sets.length)];

//             const hp = Math.floor(Math.random() * 200) + 50;
//             const attackPower = Math.floor(Math.random() * 100) + 20;

//             cards.push({
//                 id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
//                 name,
//                 types: [type],
//                 hp,
//                 attacks: [{
//                     name: 'Attaque Basique',
//                     damage: attackPower,
//                     cost: [type],
//                     text: `${name} attaque avec une puissance de ${attackPower}.`
//                 }],
//                 weaknesses: Math.random() > 0.5 ? [{
//                     type: types[Math.floor(Math.random() * types.length)],
//                     value: '×2'
//                 }] : [],
//                 resistances: Math.random() > 0.7 ? [{
//                     type: types[Math.floor(Math.random() * types.length)],
//                     value: '-20'
//                 }] : [],
//                 rarity,
//                 set,
//                 image: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=random`,
//                 category: 'Pokemon',
//                 artist: 'Artiste Classique',
//                 description: `${name} est un Pokémon de type ${type.name} avec ${hp} points de vie.`,
//                 retreat: Math.floor(Math.random() * 3),
//                 level: Math.floor(Math.random() * 100) + 1
//             });
//         }

//         return cards;
//     }

//     // Méthodes utilitaires avec les vraies méthodes du SDK
//     async getSets() {
//         try {
//             return await this.tcgdx.fetchSets();
//         } catch (error) {
//             console.error('Erreur lors de la récupération des sets:', error);
//             return [];
//         }
//     }

//     async getSetById(setId) {
//         try {
//             return await this.tcgdx.fetchSet(setId);
//         } catch (error) {
//             console.error('Erreur lors de la récupération du set:', error);
//             return null;
//         }
//     }

//     async getSeries() {
//         try {
//             return await this.tcgdx.fetchSeries();
//         } catch (error) {
//             console.error('Erreur lors de la récupération des séries:', error);
//             return [];
//         }
//     }

//     async getSerieById(serieId) {
//         try {
//             return await this.tcgdx.fetchSerie(serieId);
//         } catch (error) {
//             console.error('Erreur lors de la récupération de la série:', error);
//             return null;
//         }
//     }

//     // Méthodes utilitaires avancées
//     async getRandomSet() {
//         try {
//             if (this.availableSets.length === 0) {
//                 await this.initData();
//             }
//             const randomSet = this.availableSets[Math.floor(Math.random() * this.availableSets.length)];
//             return await this.tcgdx.fetchSet(randomSet.id);
//         } catch (error) {
//             console.error('Erreur lors de la récupération d\'un set aléatoire:', error);
//             return null;
//         }
//     }

//     async getRandomSerie() {
//         try {
//             if (this.availableSeries.length === 0) {
//                 await this.initData();
//             }
//             const randomSerie = this.availableSeries[Math.floor(Math.random() * this.availableSeries.length)];
//             return await this.tcgdx.fetchSerie(randomSerie.id);
//         } catch (error) {
//             console.error('Erreur lors de la récupération d\'une série aléatoire:', error);
//             return null;
//         }
//     }

//     // Méthode pour obtenir des statistiques
//     getAPIStats() {
//         return {
//             lang: this.tcgdx.getLang(),
//             setsLoaded: this.availableSets.length,
//             seriesLoaded: this.availableSeries.length,
//             cacheSize: this.cache.size,
//             lastUpdate: new Date().toLocaleString('fr-FR')
//         };
//     }

//     // Vider le cache si nécessaire
//     clearCache() {
//         this.cache.clear();
//         console.log('Cache API vidé');
//     }

//     // Test de connectivité API
//     async testAPI() {
//         try {
//             const testCards = await this.tcgdx.fetchCards(1);
//             console.log('✅ API TCGdx opérationnelle:', testCards.length, 'cartes récupérées');
//             return true;
//         } catch (error) {
//             console.error('❌ Erreur API TCGdx:', error);
//             return false;
//         }
//     }
// }