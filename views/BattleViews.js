export default class BattleViews {
    constructor() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    }


    setupEventListeners() {
        // Gestion des clics sur les étoiles
        document.querySelectorAll(".star").forEach((star) => {
            star.addEventListener("click", (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.setRating(rating);
            });
        });

        // Fermeture des modales en cliquant à l'extérieur
        document.querySelectorAll(".modal").forEach((modal) => {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    modal.style.display = "none";
                }
            });
        });
    }


    setupDragAndDrop() {
        const containers = document.querySelectorAll(".cards-container");

        containers.forEach((container) => {
            container.addEventListener("dragover", this.handleDragOver.bind(this));
            container.addEventListener("drop", this.handleDrop.bind(this));
            container.addEventListener("dragenter", this.handleDragEnter.bind(this));
            container.addEventListener("dragleave", this.handleDragLeave.bind(this));
        });
    }

    showLoading(show) {
        const loadingEl = document.getElementById("loading");
        loadingEl.className = show ? "loading show" : "loading";
    }

    onError(message) {
        this.showMessage(message, "error");
    }


    handleDragOver(e) {
        e.preventDefault();
    }

    handleDragEnter(e) {
        e.preventDefault();
        e.currentTarget.classList.add("drag-over");
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove("drag-over");
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove("drag-over");

        const cardId = e.dataTransfer.getData("text/plain");
        const targetContainer = e.currentTarget.id;

        if (targetContainer === "hand") {
            window.app.moveCardToHand(cardId);
        } else if (targetContainer === "deck") {
            window.app.moveCardToDeck(cardId);
        }
    }

    onStateChange(gameState) {
        this.updateDisplay(gameState);
    }

    onCardsAdded(cards) {
        this.showMessage(
            `🎉 ${cards.length} nouvelles cartes ajoutées à votre pioche!`,
            "success"
        );
    }

    onError(message) {
        this.showMessage(message, "error");
    }

    onCardMoved(data) {
        // Card moved notification (silent)
    }

    // Méthodes d'affichage
    updateDisplay(gameState) {
        this.updateDeck(gameState.deck);
        this.updateHand(gameState.hand);
        this.updateStats(gameState);
    }

    updateDeck(deck) {
        const deckEl = document.getElementById("deck");
        const deckCountEl = document.getElementById("deckCount");

        deckEl.innerHTML = "";
        deckCountEl.textContent = deck.length;

        deck.forEach((card) => {
            const cardEl = this.createCardElement(card, "deck");
            deckEl.appendChild(cardEl);
        });
    }

    updateHand(hand) {
        const handEl = document.getElementById("hand");
        const handCountEl = document.getElementById("handCount");

        handEl.innerHTML = "";
        handCountEl.textContent = hand.length;

        hand.forEach((card) => {
            const cardEl = this.createCardElement(card, "hand");
            handEl.appendChild(cardEl);
        });

        // pour n'affiche qu'une carte de la main
        // if (hand.length > 0) {
        //   const cardEl = this.createCardElement(hand[0], "hand");
        //   handEl.appendChild(cardEl);
        // }
    }

    updateStats(gameState) {
        document.getElementById("totalCards").textContent = gameState.totalCards;
        document.getElementById("rareCards").textContent = gameState.rareCards;
        document.getElementById("boosters").textContent = gameState.boosters;
        document.getElementById("battles").textContent = gameState.battles;
        document.getElementById("credits").textContent = gameState.credits;
        document.getElementById("lastDraw").textContent = gameState.lastDrawTime
            ? new Date(gameState.lastDrawTime).toLocaleString("fr-FR")
            : "Jamais";
    }

    updateTimer(gameState) {
        const remainingTime = gameState.getRemainingTime();
        const timerEl = document.getElementById("drawTimer");
        const drawBtn = document.getElementById("drawBtn");
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        timerEl.textContent = `Attendre: ${minutes}:${seconds
            .toString()
            .padStart(2, "0")}`;
        timerEl.className = "timer";
        drawBtn.disabled = true;
    }

    createCardElement(card, location) {
        const cardEl = document.createElement("div");
        cardEl.className = `card ${card.getTypeClass()}`;
        cardEl.draggable = true;
        cardEl.dataset.cardId = card.id;
        cardEl.dataset.location = location;
        if (location === "deck") {
            cardEl.className = "card card-back";
            cardEl.innerHTML = `
                <div>POKEMON</div>
                <div>TCG</div>
            `;
            // Permettre de voir le détail même pour la pioche
            cardEl.addEventListener("click", () => window.app.showCardDetails(card));
        } else {
            cardEl.innerHTML = `
            <div class="card-info">
                ${card.image
                    ? `<img src="${card.image}" alt="${card.name}" class="card-image full-cover">`
                    : ""
                }
            </div>
        `;
            cardEl.addEventListener("click", () => window.app.showCardDetails(card));
        }

        cardEl.addEventListener("dragstart", this.handleDragStart.bind(this));
        cardEl.addEventListener("dragend", this.handleDragEnd.bind(this));

        return cardEl;
    }

    handleDragStart(e) {
        e.dataTransfer.setData("text/plain", e.target.dataset.cardId);
        e.target.classList.add("dragging");
    }

    handleDragEnd(e) {
        e.target.classList.remove("dragging");
    }

    showMessage(message, type) {
        const messageEl = document.getElementById("message");
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;

        setTimeout(() => {
            messageEl.textContent = "";
            messageEl.className = "";
        }, 5000);
    }

    showLoading(show) {
        const loadingEl = document.getElementById("loading");
        loadingEl.className = show ? "loading show" : "loading";
    }

    showCardDetails(card) {
      const modal = document.getElementById("cardModal");
      const cardDetail = document.getElementById("cardDetail");

      // Affichage détaillé optimisé pour éviter le scroll
      const attacksHtml = card.attacks && card.attacks.length > 0
        ? `<div style="margin-top: 1rem;">
             <h4 style="color: #e74c3c; margin-bottom: 0.8rem; font-size: 1.1em; border-bottom: 1px solid #e74c3c; padding-bottom: 0.3rem;">⚔️ Attaques</h4>
             <div style="display: grid; gap: 0.6rem; max-height: 200px; overflow-y: auto; padding-right: 0.5rem;">
               ${card.attacks.slice(0, 4).map((attack, index) => `
                 <div style="
                   background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                   border: 1px solid #dee2e6;
                   border-radius: 8px;
                   padding: 0.6rem;
                   transition: transform 0.2s ease;
                 " onmouseover="this.style.transform='translateY(-1px)'"
                    onmouseout="this.style.transform='translateY(0)'">

                   <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                     <h6 style="color: #2c3e50; margin: 0; font-size: 0.95em; font-weight: bold;">
                       ${attack.name}
                     </h6>
                     <span style="
                       background: linear-gradient(45deg, #e74c3c, #c0392b);
                       color: white;
                       padding: 0.2rem 0.5rem;
                       border-radius: 12px;
                       font-weight: bold;
                       font-size: 0.8em;
                     ">
                       ${attack.damage || 0} 💥
                     </span>
                   </div>

                   ${attack.cost && attack.cost.length > 0 ? `
                     <div style="margin-bottom: 0.3rem;">
                       <span style="font-size: 0.75em; color: #6c757d;">Coût:</span>
                       <div style="display: flex; gap: 0.2rem; margin-top: 0.1rem;">
                         ${attack.cost.slice(0, 3).map(cost => `
                           <span style="
                             background: linear-gradient(45deg, #3498db, #2980b9);
                             color: white;
                             padding: 0.1rem 0.4rem;
                             border-radius: 10px;
                             font-size: 0.7em;
                           ">
                             ${typeof cost === 'object' ? cost.name : cost}
                           </span>
                         `).join('')}
                         ${attack.cost.length > 3 ? '<span style="font-size: 0.7em; color: #6c757d;">...</span>' : ''}
                       </div>
                     </div>
                   ` : ''}

                   ${attack.text ? `
                     <div style="
                       background: rgba(52,152,219,0.1);
                       border-left: 2px solid #3498db;
                       padding: 0.3rem;
                       margin-top: 0.3rem;
                       border-radius: 0 4px 4px 0;
                       font-style: italic;
                       color: #2c3e50;
                       font-size: 0.75em;
                       line-height: 1.3;
                       max-height: 2.6em;
                       overflow: hidden;
                       text-overflow: ellipsis;
                     ">
                       ${attack.text.length > 60 ? attack.text.substring(0, 60) + '...' : attack.text}
                     </div>
                   ` : ''}
                 </div>
               `).join('')}
               ${card.attacks.length > 4 ? `<div style="text-align: center; color: #6c757d; font-size: 0.8em;">... et ${card.attacks.length - 4} autres attaques</div>` : ''}
             </div>
           </div>`
        : '<div style="margin-top: 1rem; text-align: center; color: #6c757d; font-size: 0.9em;"><em>❌ Aucune attaque</em></div>';

      // Affichage compact des faiblesses et résistances
      const weaknessHtml = card.weaknesses && card.weaknesses.length > 0
        ? `<div style="margin-top: 0.8rem;">
             <h6 style="color: #e67e22; margin-bottom: 0.4rem; font-size: 0.9em;">🔥 Faiblesses</h6>
             <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
               ${card.weaknesses.slice(0, 3).map(w => `
                 <span style="
                   background: linear-gradient(45deg, #e67e22, #d35400);
                   color: white;
                   padding: 0.2rem 0.5rem;
                   border-radius: 10px;
                   font-size: 0.7em;
                   font-weight: 500;
                 ">
                   ${typeof w.type === 'object' ? w.type.name : w.type} ${w.value || '×2'}
                 </span>
               `).join('')}
               ${card.weaknesses.length > 3 ? '<span style="font-size: 0.7em; color: #6c757d;">...</span>' : ''}
             </div>
           </div>`
        : '';

      const resistanceHtml = card.resistances && card.resistances.length > 0
        ? `<div style="margin-top: 0.8rem;">
             <h6 style="color: #27ae60; margin-bottom: 0.4rem; font-size: 0.9em;">🛡️ Résistances</h6>
             <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
               ${card.resistances.slice(0, 3).map(r => `
                 <span style="
                   background: linear-gradient(45deg, #27ae60, #229954);
                   color: white;
                   padding: 0.2rem 0.5rem;
                   border-radius: 10px;
                   font-size: 0.7em;
                   font-weight: 500;
                 ">
                   ${typeof r.type === 'object' ? r.type.name : r.type} ${r.value || '-20'}
                 </span>
               `).join('')}
               ${card.resistances.length > 3 ? '<span style="font-size: 0.7em; color: #6c757d;">...</span>' : ''}
             </div>
           </div>`
        : '';

      cardDetail.innerHTML = `
        <div style="max-width: 500px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 1rem;">
            <h3 style="color: #2c3e50; margin-bottom: 0.8rem; font-size: 1.3em; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
              ${card.name}
            </h3>
            ${card.image ? `
              <img src="${card.image}" alt="${card.name}" style="
                max-width: 200px;
                max-height: 200px;
                border-radius: 10px;
                box-shadow: 0 6px 12px rgba(0,0,0,0.2);
                margin-bottom: 0.8rem;
                object-fit: cover;
              ">
            ` : ''}

            <div style="display: flex; justify-content: space-around; gap: 0.5rem; margin-top: 0.8rem;">
              <div style="
                background: linear-gradient(45deg, #e74c3c, #c0392b);
                color: white;
                padding: 0.5rem 0.8rem;
                border-radius: 15px;
                font-weight: bold;
                font-size: 0.9em;
                box-shadow: 0 3px 6px rgba(231,76,60,0.3);
              ">
                ❤️ ${card.getHP()} PV
              </div>
              ${card.types && card.types.length > 0 ? `
                <div style="
                  background: linear-gradient(45deg, #9b59b6, #8e44ad);
                  color: white;
                  padding: 0.5rem 0.8rem;
                  border-radius: 15px;
                  font-weight: bold;
                  font-size: 0.9em;
                  box-shadow: 0 3px 6px rgba(155,89,182,0.3);
                ">
                  ⭐ ${card.types.map(t => t.name || t).slice(0, 2).join(', ')}
                </div>
              ` : ''}
            </div>
          </div>

          ${attacksHtml}
          ${weaknessHtml}
          ${resistanceHtml}
        </div>
      `;

      modal.style.display = "block";
    }

    updateBattleZone(battleState) {
        // Afficher les cartes actives et PV
        const playerZone = document.getElementById('playerActiveCard');
        const opponentZone = document.getElementById('opponentActiveCard');
        const playerHP = document.getElementById('playerHP');
        const opponentHP = document.getElementById('opponentHP');
        const log = document.getElementById('battleLog');
        if (battleState.playerActiveCard) {
            playerZone.innerHTML = `<img src="${battleState.playerActiveCard.image}" alt="${battleState.playerActiveCard.name}" class="battle-card-image" style="cursor:pointer;"><div>${battleState.playerActiveCard.name}</div>`;
            playerHP.textContent = battleState.playerHP;
            // Ajout du clic pour voir les détails
            const img = playerZone.querySelector('img');
            if (img) {
                img.addEventListener('click', () => window.app.showCardDetails(battleState.playerActiveCard));
            }
        }
        if (battleState.opponentActiveCard) {
            opponentZone.innerHTML = `<img src="${battleState.opponentActiveCard.image}" alt="${battleState.opponentActiveCard.name}" class="battle-card-image" style="cursor:pointer;"><div>${battleState.opponentActiveCard.name}</div>`;
            opponentHP.textContent = battleState.opponentHP;
            // Ajout du clic pour voir les détails
            const img = opponentZone.querySelector('img');
            if (img) {
                img.addEventListener('click', () => window.app.showCardDetails(battleState.opponentActiveCard));
            }
        }
        log.innerHTML = battleState.battleLog.slice(-6).map(l => `<div>${l}</div>`).join('');
    }

    showChooseActiveModal(hand, onSelect) {
        // Crée une modale pour choisir la carte active
        let modal = document.getElementById('chooseActiveModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'chooseActiveModal';
            modal.className = 'modal';
            modal.innerHTML = `<div class="modal-content" style="display:flex;flex-direction:column;align-items:center;max-width:600px;">
                <button class="close-btn" onclick="document.getElementById('chooseActiveModal').style.display='none'">&times;</button>
                <h2>Choisissez votre carte active</h2>
                <div id="chooseActiveList" style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;"></div>
            </div>`;
            document.body.appendChild(modal);
        }
        const list = modal.querySelector('#chooseActiveList');
        list.innerHTML = '';
        hand.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = `card ${card.getTypeClass()}`;
            cardDiv.style.cursor = 'pointer';
            cardDiv.innerHTML = `
                <img src="${card.image}" alt="${card.name}" style="width:80px;height:110px;border-radius:8px;box-shadow:0 2px 8px #aaa;">
                <div style="font-weight:bold;">${card.name}</div>
                <div style="font-size:0.9em;">PV: ${card.getHP()}</div>
            `;
            cardDiv.onclick = () => {
                modal.style.display = 'none';
                onSelect(card);
            };
            list.appendChild(cardDiv);
        });
        modal.style.display = 'block';
    }

    showChooseAttackModal(attacks, onSelect) {
        let modal = document.getElementById('chooseAttackModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'chooseAttackModal';
            modal.className = 'modal';
            modal.innerHTML = `<div class="modal-content" style="display:flex;flex-direction:column;align-items:center;max-width:500px;background:white;padding:2rem 1.5rem;border-radius:18px;box-shadow:0 8px 32px #0002;">
                <button class="close-btn" onclick="document.getElementById('chooseAttackModal').style.display='none'">&times;</button>
                <h2 style='color:#e74c3c;margin-bottom:1.5rem;'>Choisissez une attaque</h2>
                <div id="chooseAttackList" style="display:flex;flex-direction:column;gap:1.2rem;width:100%;margin-top:1rem;"></div>
            </div>`;
            document.body.appendChild(modal);
        }
        const list = modal.querySelector('#chooseAttackList');
        list.innerHTML = '';
        attacks.forEach(attack => {
            const btn = document.createElement('button');
            btn.className = 'btn-battle';
            btn.style.margin = '0';
            btn.style.display = 'flex';
            btn.style.flexDirection = 'column';
            btn.style.alignItems = 'flex-start';
            btn.style.textAlign = 'left';
            btn.style.gap = '0.2rem';
            btn.innerHTML = `
                <span style='font-size:1.1em;font-weight:bold;color:#c0392b;'>${attack.name}</span>
                <span style='color:#888;font-size:0.95em;'>Dégâts : <b>${attack.damage || 0}</b></span>
                ${attack.cost ? `<span style='color:#2980b9;font-size:0.9em;'>Coût : ${attack.cost.map(c=>c.name||c).join(', ')}</span>` : ''}
                <span style='font-size:0.95em;color:#555;'>${attack.text || ''}</span>
            `;
            btn.onmouseover = () => btn.style.background = 'linear-gradient(145deg,#f8d7da,#f5c6cb)';
            btn.onmouseout = () => btn.style.background = '';
            btn.onclick = () => {
                modal.style.display = 'none';
                onSelect(attack);
            };
            list.appendChild(btn);
        });
        modal.style.display = 'block';
    }
}