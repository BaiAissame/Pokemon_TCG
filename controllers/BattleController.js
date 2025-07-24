import GameStateModel from "../models/GameStateModel.js";
import BattleViews from "../views/BattleViews.js";
import PokemonTCGAPIService from "../service/PokemonTCGAPIService.js";
import CardModel from "../models/CardModel.js";
import SoundService from "../service/SoundService.js";
import AchievementService from "../service/AchievementService.js";
import BoosterService from "../service/BoosterService.js";
import CardAnimationService from "../service/CardAnimationService.js";

export default class BattleController {
  constructor() {
    this.gameState = new GameStateModel();
    this.battleViews = new BattleViews();
    this.pokemonAPI = new PokemonTCGAPIService();
    this.soundService = new SoundService();
    this.achievementService = new AchievementService(this.gameState);
    this.boosterService = new BoosterService(
      this.pokemonAPI,
      this.soundService
    );
    this.animationService = new CardAnimationService();
    this.selectedRating = 0;
    this.selectedBoosterType = "standard";
    this.battleState = {
      inBattle: false,
      currentOpponent: null,
      opponentName: "adversaire",
      playerActiveCard: null,
      opponentActiveCard: null,
      playerHP: 100,
      opponentHP: 100,
      turn: "player",
      battleLog: [],
      combo: 0,
      score: 0,
      difficulty: "normal",
    };
    this.gameState.addObserver(this.battleViews);
    this.init();
  }

  async init() {
    this.gameState.load();
    this.startTimer();

    if (this.gameState.deck.length === 0 && this.gameState.hand.length === 0) {
      await this.drawCards();
    }

    this.chooseOpponent();
    this.chooseActiveCard();
    this.soundService.playMusic("next-battle.mp3");
    setTimeout(() => {
      this.battleViews.hiddenModalVS();
      this.soundService.playMusic("encounter.mp3", true);
    }, 3700);
  }

  startTimer() {
    // setInterval(() => {
    //   this.battleViews.updateTimer(this.gameState);
    // }, 1000);
  }

  async drawCards() {
    await this.openBooster(this.selectedBoosterType);
  }

  async openBooster(boosterType = "standard") {
    if (boosterType === "standard" && !this.gameState.canDrawCards()) {
      this.battleViews.onError(
        "Vous devez attendre 5 minutes entre chaque tirage standard!"
      );
      return;
    }

    const boosterConfig = this.boosterService.boosterTypes[boosterType];
    if (this.gameState.credits < boosterConfig.price) {
      this.battleViews.onError(
        `Crédits insuffisants! Il vous faut ${boosterConfig.price} crédits.`
      );
      return;
    }

    this.battleViews.showLoading(true);

    try {
      const result = await this.boosterService.openBooster(
        boosterType,
        this.gameState
      );

      await this.animationService.playBoosterOpenAnimation(
        boosterType,
        result.cards
      );

      this.battleViews.showBoosterResult(result);
      if (boosterType === "standard") {
        this.gameState.setLastDrawTime();
      }

      this.gameState.boosters++;

      this.achievementService.checkAchievements();

      this.gameState.save();

      const rareCount = result.cards.filter(
        (card) =>
          card.rarity?.name !== "Common" && card.rarity?.name !== "Uncommon"
      ).length;
      let message = `🎉 ${boosterConfig.name} ouvert! ${result.cards.length} cartes obtenues`;
      if (rareCount > 0) {
        message += ` dont ${rareCount} carte${rareCount > 1 ? "s" : ""} rare${
          rareCount > 1 ? "s" : ""
        }!`;
      }

      this.battleViews.showMessage(message, "success");
    } catch (error) {
      console.error("Erreur lors de l'ouverture du booster:", error);
      this.battleViews.onError(
        "Erreur lors de l'ouverture du booster. Veuillez réessayer."
      );
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
    document.getElementById("cardModal").style.display = "none";
  }

  async chooseActiveCard() {
    if (this.gameState.hand.length === 0) {
      this.battleViews.onError("Vous n'avez aucune carte en main !");
      return;
    }

    // Vérifier si une carte est déjà sélectionnée
    if (localStorage.getItem("selectedCard") == null) {
      const data = {
        id: this.gameState.hand[0].id,
        battleHp: this.gameState.hand[0].getBattleHP(),
      };
      localStorage.setItem("selectedCard", JSON.stringify([data]));
    }

    const playerCards = JSON.parse(localStorage.getItem("selectedCard"));

    this.battleState.playerActiveCard = this.gameState.hand[0];

    // persister la carte active (point de vie)
    let isPrensentCard = false;

    playerCards.forEach((cardData) => {
      if (cardData.id === this.gameState.hand[0].id) {
        this.battleState.playerHP = cardData.battleHp;

        this.updateBattleZone();
        this.checkAttackReady();
        this.soundService.playSound("cardPlay");
        isPrensentCard = true;
      }
    });

    if (!isPrensentCard) {
      playerCards.push({
        id: this.gameState.hand[0].id,
        battleHp: this.gameState.hand[0].getBattleHP(),
      });
      localStorage.setItem("selectedCard", JSON.stringify(playerCards));
      this.battleState.playerHP = this.gameState.hand[0].getBattleHP();
      this.updateBattleZone();
      this.checkAttackReady();
      this.soundService.playSound("cardPlay");
    }
  }

  async chooseOpponent() {
    // Solution sécurisée
    const trainers = JSON.parse(localStorage.getItem("trainers")) || [];

    // Vérifier si selectedTrainer existe et n'est pas null/vide
    const selectedTrainerData = localStorage.getItem("selectedTrainer");
    let randomTrainer = null;

    if (selectedTrainerData && selectedTrainerData.trim() !== "") {
      try {
        randomTrainer = JSON.parse(selectedTrainerData);
      } catch (error) {
        console.warn("Erreur parsing selectedTrainer:", error);
        randomTrainer = null;
      }
    }

    // Si selectedTrainer n'est pas défini ou invalide, choisir aléatoirement
    if (!randomTrainer && trainers.length > 0) {
      const randomIndex = Math.floor(Math.random() * trainers.length);
      randomTrainer = trainers[randomIndex];
    }

    // Assigner l'opponent
    if (randomTrainer) {
      this.battleState.currentOpponent = randomTrainer;
    } else {
      console.error("Aucun trainer disponible");
    }
    if (localStorage.getItem("cardTrainer") == null) {
      const cards = await this.pokemonAPI.getRandomCards(1);
      localStorage.setItem("cardTrainer", JSON.stringify(cards[0]));
    }
    const card = JSON.parse(localStorage.getItem("cardTrainer"));

    this.battleState.opponentName = randomTrainer.name;
    this.battleState.opponentActiveCard = new CardModel(card);

    if (localStorage.getItem("trainerHP") == null) {
      localStorage.setItem(
        "trainerHP",
        JSON.stringify(this.battleState.opponentActiveCard.getHP())
      );
    }
    this.battleState.opponentHP = JSON.parse(localStorage.getItem("trainerHP"));
    this.updateBattleZone();
    this.checkAttackReady();
  }

  checkAttackReady() {
    const btn = document.getElementById("attackBtn");
    if (
      this.battleState.playerActiveCard &&
      this.battleState.opponentActiveCard
    ) {
      btn.disabled = false;
    } else {
      btn.disabled = true;
    }
  }

  attack() {
    if (
      !this.battleState.playerActiveCard ||
      !this.battleState.opponentActiveCard
    ) {
      this.battleViews.onError("Sélectionnez une carte et un adversaire !");
      return;
    }
    if (this.battleState.turn !== "player") return;

    let attacks = Array.isArray(this.battleState.playerActiveCard.attacks)
      ? this.battleState.playerActiveCard.attacks
      : [];
    if (!attacks || attacks.length === 0) {
      attacks = [{ name: "Charge", damage: 10, text: "Attaque par défaut." }];
    }

    this.battleViews.showChooseAttackModal(attacks, (attack) => {
      let dmg = 0;
      if (typeof attack.damage === "number") {
        dmg = attack.damage;
      } else if (typeof attack.damage === "string") {
        const match = attack.damage.match(/\d+/);
        dmg = match ? parseInt(match[0]) : 0;
      }
      dmg = this.applyWeaknessResistance(
        dmg,
        this.battleState.playerActiveCard,
        this.battleState.opponentActiveCard
      );
      this.battleState.opponentHP = Math.max(
        0,
        this.battleState.opponentHP - dmg
      );
      localStorage.setItem(
        "trainerHP",
        JSON.stringify(this.battleState.opponentHP)
      );
      this.battleState.battleLog.push(
        `${this.battleState.playerActiveCard.name} utilise ${attack.name} pour ${dmg} dégâts !`
      );

      this.addCombo();
      this.soundService.playSound("attack");
      if (this.battleState.combo > 1) {
        this.soundService.playSound("combo", {
          pitch: 1 + this.battleState.combo * 0.1,
        });
      }

      this.updateBattleZone();
      if (this.battleState.opponentHP <= 0) {
        this.battleState.battleLog.push("🎉 Victoire !");
        this.gameState.credits += 50;
        this.gameState.battles++;

        const perfectWin =
          this.battleState.playerHP ===
          this.battleState.playerActiveCard.getHP();
        if (perfectWin) {
          this.battleState.perfectWin = true;
          this.battleState.battleLog.push("🛡️ Victoire parfaite !");
        }

        this.soundService.playSound("win");
        this.gameState.updateStatistics("totalWins", 1);
        this.gameState.updateStatistics("currentWinStreak", 1);
        // this.achievementService.checkAchievements(this.battleState);
        this.updateBattleZone();
        this.resetCombo();
        this.battleResult(true);
        return;
      }
      this.battleState.turn = "opponent";
      setTimeout(() => this.opponentAttack(), 1200);
    });
  }

  applyWeaknessResistance(dmg, attacker, defender) {
    let finalDmg = dmg;
    if (
      defender.weaknesses &&
      defender.weaknesses.length > 0 &&
      attacker.types &&
      attacker.types.length > 0
    ) {
      const atkType = attacker.types[0].name || attacker.types[0];
      const weak = defender.weaknesses.find(
        (w) => w.type && (w.type.name === atkType || w.type === atkType)
      );
      if (weak && weak.value && weak.value.includes("2")) finalDmg *= 2;
    }
    if (
      defender.resistances &&
      defender.resistances.length > 0 &&
      attacker.types &&
      attacker.types.length > 0
    ) {
      const atkType = attacker.types[0].name || attacker.types[0];
      const res = defender.resistances.find(
        (r) => r.type && (r.type.name === atkType || r.type === atkType)
      );
      if (res && res.value && res.value.includes("20"))
        finalDmg = Math.max(0, finalDmg - 20);
    }
    return finalDmg;
  }

  opponentAttack() {
    if (!this.battleState.opponentActiveCard) return;
    let attacks = Array.isArray(this.battleState.opponentActiveCard.attacks)
      ? this.battleState.opponentActiveCard.attacks
      : [];
    if (!attacks || attacks.length === 0) {
      attacks = [{ name: "Charge", damage: 10, text: "Attaque par défaut." }];
    }
    const attack = attacks[Math.floor(Math.random() * attacks.length)];
    let dmg = 0;
    if (attack) {
      if (typeof attack.damage === "number") {
        dmg = attack.damage;
      } else if (typeof attack.damage === "string") {
        const match = attack.damage.match(/\d+/);
        dmg = match ? parseInt(match[0]) : 0;
      }
    }
    dmg = this.applyWeaknessResistance(
      dmg,
      this.battleState.opponentActiveCard,
      this.battleState.playerActiveCard
    );
    this.battleState.playerHP = Math.max(0, this.battleState.playerHP - dmg);

    const playerCards = JSON.parse(localStorage.getItem("selectedCard"));
    playerCards.forEach((cardData) => {
      if (cardData.id === this.battleState.playerActiveCard.id) {
        cardData.battleHp = this.battleState.playerHP;
        localStorage.setItem("selectedCard", JSON.stringify(playerCards));
      }
    });

    this.battleState.battleLog.push(
      `${this.battleState.opponentActiveCard.name} utilise ${
        attack ? attack.name : "Attaque"
      } pour ${dmg} dégâts !`
    );
    this.updateBattleZone();
    if (this.battleState.playerHP <= 0) {
      this.battleState.battleLog.push("💀 Défaite...");

      this.soundService.playSound("lose");
      this.gameState.updateStatistics("totalLosses", 1);
      this.gameState.statistics.currentWinStreak = 0; // Reset win streak
      this.resetCombo();
      this.updateBattleZone();
      this.battleResult(false);
      return;
    }
    this.battleState.turn = "player";
  }

  updateBattleZone() {
    this.battleViews.updateBattleZone(this.battleState);
  }

  addCombo() {
    this.battleState.combo++;
    const bonusPoints = this.battleState.combo * 10;
    this.battleState.score += bonusPoints;
    if (this.battleState.combo > 1) {
      this.battleState.battleLog.push(
        `🔥 Combo x${this.battleState.combo}! +${bonusPoints} points!`
      );
    }
  }

  resetCombo() {
    this.battleState.combo = 0;
  }

  addCardsToDeck(cards) {
    try {
      const cardModels = cards.map((cardData) => new CardModel(cardData));
      this.gameState.addCardsToDeck(cardModels);
      this.gameState.save();

      this.battleViews.showMessage(
        `🎉 ${cards.length} cartes ajoutées au deck !`,
        "success"
      );
    } catch (error) {
      console.error("Erreur lors de l'ajout des cartes:", error);
      this.battleViews.onError("Erreur lors de l'ajout des cartes au deck.");
    }
  }

  setSelectedRating(rating) {
    this.selectedRating = rating;
  }

  battleResult(you_win) {
    setTimeout(() => {
      const data = JSON.parse(localStorage.getItem("pokemonTCG_gameState"));
      data.deck.push(data.hand[0]);
      data.hand = [];
      localStorage.setItem("pokemonTCG_gameState", JSON.stringify(data));
      const modal = document.getElementById("battle-Modal");
      if (you_win) {
        modal.querySelector("h2").textContent = "🎉 Victoire 🎉";
        modal.querySelector(
          "#battle-modal-message"
        ).textContent = `Vous avez gagné contre ${this.battleState.opponentName} !`;
      } else {
        modal.querySelector("h2").textContent = "💀 Défaite 💀";
        modal.querySelector(
          "#battle-modal-message"
        ).textContent = `Vous avez perdu contre ${this.battleState.opponentName}.`;
        this.soundService.looserSound();
      }

      modal.style.display = "block";
    }, 1500);
  }
}
