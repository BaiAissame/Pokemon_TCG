// views/GameView.js
class GameView {
  // Observer methods
  onStateChange(gameState) {
    this.updateDisplay(gameState);
  }

  // Méthodes d'affichage
  updateDisplay(gameState) {
    this.updateTrainersList(gameState.trainers);
  }

  updateTimer(gameState) {
    // Timer updates disabled for battle page
  }

  showMessage(message, type) {
    const messageEl = document.getElementById("message");
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `message ${type}`;

      setTimeout(() => {
        messageEl.textContent = "";
        messageEl.className = "";
      }, 5000);
    }
  }

  updateTrainersList(trainers) {
    const trainersListEl = document.getElementById("trainersList");
    if (!trainersListEl) return;

    trainersListEl.innerHTML = "";

    // Gérer les différents types de données trainers
    let trainerArray = [];
    if (typeof trainers === 'string') {
      try {
        trainerArray = JSON.parse(trainers);
      } catch (e) {
        console.error('Erreur de parsing des trainers:', e);
        return;
      }
    } else if (Array.isArray(trainers)) {
      trainerArray = trainers;
    } else {
      return; // Pas de trainers valides
    }

    if (!Array.isArray(trainerArray) || trainerArray.length === 0) return;

    trainerArray.forEach((trainer) => {
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
