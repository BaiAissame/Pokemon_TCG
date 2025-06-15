// views/GameView.js
class GameView {
  // constructor() {
  //   this.setupEventListeners();
  //   this.setupDragAndDrop();
  // }

  // setupEventListeners() {
  //   // Gestion des clics sur les étoiles
  //   document.querySelectorAll(".star").forEach((star) => {
  //     star.addEventListener("click", (e) => {
  //       const rating = parseInt(e.target.dataset.rating);
  //       this.setRating(rating);
  //     });
  //   });

  //   // Fermeture des modales en cliquant à l'extérieur
  //   document.querySelectorAll(".modal").forEach((modal) => {
  //     modal.addEventListener("click", (e) => {
  //       if (e.target === modal) {
  //         modal.style.display = "none";
  //       }
  //     });
  //   });
  // }

  // setupDragAndDrop() {
  //   const containers = document.querySelectorAll(".cards-container");

  //   containers.forEach((container) => {
  //     container.addEventListener("dragover", this.handleDragOver.bind(this));
  //     container.addEventListener("drop", this.handleDrop.bind(this));
  //     container.addEventListener("dragenter", this.handleDragEnter.bind(this));
  //     container.addEventListener("dragleave", this.handleDragLeave.bind(this));
  //   });
  // }

  // handleDragOver(e) {
  //   e.preventDefault();
  // }

  // handleDragEnter(e) {
  //   e.preventDefault();
  //   e.currentTarget.classList.add("drag-over");
  // }

  // handleDragLeave(e) {
  //   e.currentTarget.classList.remove("drag-over");
  // }

  // handleDrop(e) {
  //   e.preventDefault();
  //   e.currentTarget.classList.remove("drag-over");

  //   const cardId = e.dataTransfer.getData("text/plain");
  //   const targetContainer = e.currentTarget.id;

  //   if (targetContainer === "hand") {
  //     window.app.moveCardToHand(cardId);
  //   } else if (targetContainer === "deck") {
  //     window.app.moveCardToDeck(cardId);
  //   }
  // }

  // Observer methods
  onStateChange(gameState) {
    this.updateDisplay(gameState);
  }

  // onCardsAdded(cards) {
  //   this.showMessage(
  //     `🎉 ${cards.length} nouvelles cartes ajoutées à votre pioche!`,
  //     "success"
  //   );
  // }

  // onError(message) {
  //   this.showMessage(message, "error");
  // }

  // onCardMoved(data) {
  //   console.log(
  //     `Carte ${data.card.name} déplacée de ${data.from} vers ${data.to}`
  //   );
  // }

  // Méthodes d'affichage
  updateDisplay(gameState) {
    // this.updateDeck(gameState.deck);
    // this.updateHand(gameState.hand);
    // this.updateStats(gameState);
    this.updateTrainersList(gameState.trainers);
  }

  // updateDeck(deck) {
  //   const deckEl = document.getElementById("deck");
  //   const deckCountEl = document.getElementById("deckCount");

  //   deckEl.innerHTML = "";
  //   deckCountEl.textContent = deck.length;

  //   deck.forEach((card) => {
  //     const cardEl = this.createCardElement(card, "deck");
  //     deckEl.appendChild(cardEl);
  //   });
  // }

  // updateHand(hand) {
  //   const handEl = document.getElementById("hand");
  //   const handCountEl = document.getElementById("handCount");

  //   handEl.innerHTML = "";
  //   handCountEl.textContent = hand.length;

  //   hand.forEach((card) => {
  //     const cardEl = this.createCardElement(card, "hand");
  //     handEl.appendChild(cardEl);
  //   });

  //   // pour n'affiche qu'une carte de la main
  //   // if (hand.length > 0) {
  //   //   const cardEl = this.createCardElement(hand[0], "hand");
  //   //   handEl.appendChild(cardEl);
  //   // }
  // }

  // updateStats(gameState) {
  //   document.getElementById("totalCards").textContent = gameState.totalCards;
  //   document.getElementById("rareCards").textContent = gameState.rareCards;
  //   document.getElementById("boosters").textContent = gameState.boosters;
  //   document.getElementById("battles").textContent = gameState.battles;
  //   document.getElementById("credits").textContent = gameState.credits;
  //   document.getElementById("lastDraw").textContent = gameState.lastDrawTime
  //     ? new Date(gameState.lastDrawTime).toLocaleString("fr-FR")
  //     : "Jamais";
  // }

  updateTimer(gameState) {
    // const remainingTime = gameState.getRemainingTime();
    // const timerEl = document.getElementById("drawTimer");
    // const drawBtn = document.getElementById("drawBtn");
    // const minutes = Math.floor(remainingTime / 60000);
    // const seconds = Math.floor((remainingTime % 60000) / 1000);
    // timerEl.textContent = `Attendre: ${minutes}:${seconds
    //   .toString()
    //   .padStart(2, "0")}`;
    // timerEl.className = "timer";
    // drawBtn.disabled = true;
  }


  updateTrainersList(trainers) {
    const trainersListEl = document.getElementById("trainersList");
    trainersListEl.innerHTML = "";
    if (Array.isArray(trainers) && trainers.length === 0) return
    trainers = JSON.parse(trainers);
    trainers.forEach((trainer) => {
      const trainerEl = document.createElement("form");
      trainerEl.className = "trainer-card";
      trainerEl.action = "/battle.html";
      trainerEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <img src="${trainer.avatar}" alt="${trainer.name
        }" style="width: 40px; height: 40px; border-radius: 50%;">
                    <div style="flex: 1;">
                        <div><strong>${trainer.name}</strong> ${trainer.online ? "🟢" : "🔴"
        }</div>
                        <div>⭐ ${trainer.rating} | ⚔️ ${trainer.battles
        } combats</div>
                    </div>
                    <div>
                        <button class="btn-battle" onclick="event.preventDefault()" ${trainer.online ? "" : "disabled"}>
                            ⚔️ Défier
                        </button>
                    </div>
                </div>
            `;

      // renvoi sur la page de combat tout en sauvegardant le trainer sélectionné
      trainerEl.addEventListener("click", () => {
        localStorage.setItem("selectedTrainer", JSON.stringify(trainer));
        window.location.href = trainerEl.action
        // window.app.startBattle(trainer.name);
      });

      trainersListEl.appendChild(trainerEl);
    });
  }
  // createCardElement(card, location) {
  //   const cardEl = document.createElement("div");
  //   cardEl.className = `card ${card.getTypeClass()}`;
  //   cardEl.draggable = true;
  //   cardEl.dataset.cardId = card.id;
  //   cardEl.dataset.location = location;
  //   if (location === "deck") {
  //     cardEl.className = "card card-back";
  //     cardEl.innerHTML = `
  //               <div>POKEMON</div>
  //               <div>TCG</div>
  //           `;
  //   } else {
  //     cardEl.innerHTML = `
  //           <div class="card-info">
  //               ${card.image
  //         ? `<img src="${card.image}" alt="${card.name}" class="card-image full-cover">`
  //         : ""
  //       }
  //           </div>
  //       `;
  //     cardEl.addEventListener("click", () => window.app.showCardDetails(card));
  //   }

  //   cardEl.addEventListener("dragstart", this.handleDragStart.bind(this));
  //   cardEl.addEventListener("dragend", this.handleDragEnd.bind(this));

  //   return cardEl;
  // }

  // handleDragStart(e) {
  //   e.dataTransfer.setData("text/plain", e.target.dataset.cardId);
  //   e.target.classList.add("dragging");
  // }

  // handleDragEnd(e) {
  //   e.target.classList.remove("dragging");
  // }

  // showMessage(message, type) {
  //   const messageEl = document.getElementById("message");
  //   messageEl.textContent = message;
  //   messageEl.className = `message ${type}`;

  //   setTimeout(() => {
  //     messageEl.textContent = "";
  //     messageEl.className = "";
  //   }, 5000);
  // }

  // showLoading(show) {
  //   const loadingEl = document.getElementById("loading");
  //   loadingEl.className = show ? "loading show" : "loading";
  // }

  // showCardDetails(card) {
  //   const modal = document.getElementById("cardModal");
  //   const cardDetail = document.getElementById("cardDetail");

  //   cardDetail.innerHTML = `
  //               ${card.image
  //       ? `<img src="${card.image}" alt="${card.name}" style="max-width: 400px;">`
  //       : ""
  //     }
  //       `;

  //   modal.style.display = "block";
  // }

  showTrainerModal(trainer) {
    const modal = document.getElementById("trainerModal");
    const title = document.getElementById("trainerModalTitle");

    title.textContent = `Interaction avec ${trainer.name}`;
    modal.style.display = "block";
  }

  setRating(rating) {
    const stars = document.querySelectorAll(".star");
    stars.forEach((star, index) => {
      star.classList.toggle("active", index < rating);
    });
    window.app.setSelectedRating(rating);
  }

  closeModal() {
    document.getElementById("cardModal").style.display = "none";
  }

  closeTrainerModal() {
    document.getElementById("trainerModal").style.display = "none";
  }
  launchBattle() {
    const battleGround = document.getElementById("battle-section");
    battleGround.innerHTML = `
        <h3>⚔️ Combat en cours</h3>
        
        <!-- Zone de combat principale -->
        <div class="battle-arena">
            <!-- Cartes actives des combattants -->
            <div class="active-cards-zone">
                <!-- Carte du joueur (gauche) -->
                <div class="player-active-zone">
                    <h4>Votre carte</h4>
                    <div class="active-card-slot" id="playerActiveCard">
                        <div class="empty-card-slot">Sélectionnez une carte</div>
                    </div>
                </div>

                <!-- VS au centre -->
                <div class="vs-zone">
                    <div class="vs-indicator">VS</div>
                    <div class="battle-info">
                        <div class="turn-indicator" id="turnIndicator">Votre tour</div>
                        <button class="btn btn-attack" id="attackBtn" onclick="window.app.playerAttack()" disabled>
                            ⚡ Attaquer
                        </button>
                    </div>
                </div>

                <!-- Carte de l'adversaire (droite) -->
                <!-- <div class="opponent-active-zone">
                    <h4>Carte adverse</h4>
                    <div class="active-card-slot" id="opponentActiveCard">
                        <div class="empty-card-slot">Carte mystère</div>
                    </div>
                </div> -->
            </div>

            <!-- Ma main en bas -->
            <div class="battle-hand-zone">
              <div>
                <h4>🃏 Vos cartes disponibles</h4>
                <div class="battle-hand-container" id="battleHand">
                    <!-- Les cartes de la main seront ajoutées ici -->
                </div>
              </div>
              <div class="opponent-active-zone">
                <h4>Carte adverse</h4>
                <div class="active-card-slot" id="opponentActiveCard">
                  <div class="empty-card-slot">Carte mystère</div>
                </div>
              </div>
            </div>

            <!-- Actions de combat -->
            <div class="battle-controls">
                <button class="btn btn-surrender" onclick="window.app.surrenderBattle()">
                    🏳️ Abandonner
                </button>
                <button class="btn" onclick="window.app.exitBattle()">
                    🚪 Quitter le combat
                </button>
            </div>
        </div>
    `;

    // Charger les cartes de la main
    this.loadBattleHand();
  }

  loadBattleHand() {
    const battleHandEl = document.getElementById("battleHand");
    if (!battleHandEl || !window.app?.gameState?.hand) return;

    battleHandEl.innerHTML = "";

    window.app.gameState.hand.forEach((card) => {
      const cardEl = document.createElement("div");
      cardEl.className = `battle-hand-card ${card.getTypeClass()}`;
      cardEl.dataset.cardId = card.id;

      cardEl.innerHTML = `
          <div class="battle-card-content">
              ${card.image
          ? `<img src="${card.image}" alt="${card.name}" class="battle-card-image">`
          : `<div class="battle-card-placeholder">${card.name}</div>`
        }
              <div class="battle-card-info">
                  <div class="battle-card-name">${card.name}</div>
                  <div class="battle-card-stats">
                      <span>HP: ${card.getHP()}</span>
                      <span>ATK: ${card.getAttackPower()}</span>
                  </div>
              </div>
          </div>
      `;

      cardEl.addEventListener("click", () => {
        this.selectBattleCard(card, cardEl);
      });

      battleHandEl.appendChild(cardEl);
    });
  }

  selectBattleCard(card, cardElement) {
    // Enlever la sélection précédente
    document.querySelectorAll('.battle-hand-card').forEach(el => {
      el.classList.remove('selected');
    });

    // Sélectionner la nouvelle carte
    cardElement.classList.add('selected');

    // Afficher la carte dans la zone active du joueur
    const playerActiveEl = document.getElementById('playerActiveCard');
    playerActiveEl.innerHTML = `
      <div class="battle-active-card ${card.getTypeClass()}">
          ${card.image ?
        `<img src="${card.image}" alt="${card.name}" class="active-card-image">` :
        `<div class="active-card-placeholder">${card.name}</div>`
      }
          <div class="active-card-info">
              <div class="active-card-name">${card.name}</div>
              <div class="active-card-stats">
                  <span>HP: ${card.getHP()}</span>
                  <span>ATK: ${card.getAttackPower()}</span>
              </div>
          </div>
      </div>
  `;

    // Activer le bouton d'attaque
    const attackBtn = document.getElementById('attackBtn');
    if (attackBtn) {
      attackBtn.disabled = false;
    }

    // Sauvegarder la carte sélectionnée
    if (window.app) {
      window.app.selectedBattleCard = card;
    }
  }
}

export default GameView;
