
export default class BattleViews {
    constructor() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    }


    setupEventListeners() {
        // document.querySelectorAll(".star").forEach((star) => {
        //     star.addEventListener("click", (e) => {
        //         const rating = parseInt(e.target.dataset.rating);
        //         this.setRating(rating);
        //     });
        // });

        document.querySelectorAll(".modal").forEach((modal) => {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    modal.style.display = "none";
                }
            });
        });

        const stars = document.querySelectorAll('#rating-stars .star');
        let selectedRating = 0;

        stars.forEach(star => {
            star.addEventListener('click', function () {
                selectedRating = parseInt(this.dataset.value);
                stars.forEach((s, i) => {
                    s.textContent = i < selectedRating ? '★' : '☆';
                });
                console.log(selectedRating);
            });
        });

        document.getElementById('submit-rating').addEventListener('click', function () {

            if (selectedRating === 0) {
                alert("Veuillez sélectionner une note !");
                return;
            }

            const trainer = JSON.parse(localStorage.getItem('selectedTrainer'));
            const trainers = JSON.parse(localStorage.getItem('trainers'));
            trainer.rating = (trainer.rating * trainer.battles + selectedRating) / (trainer.battles + 1);
            trainer.rating = trainer.rating.toFixed(1);
            trainer.battles++
            trainers.forEach((value, index) => {
                if (value.id === trainer.id) {
                    trainers[index] = trainer;
                }
            })

            localStorage.setItem('trainers', JSON.stringify(trainers));
      
            localStorage.removeItem('selectedCard');
            localStorage.removeItem('trainerHP');
            localStorage.removeItem('cardTrainer');
            localStorage.removeItem('selectedTrainer');

            // Ici, tu peux envoyer la note au serveur ou la traiter comme tu veux
            alert("Note envoyée : " + selectedRating + " étoile(s)");
            // Fermer la modal si besoin
            window.location = "/"; // Rediriger vers la page d'accueil ou une autre page
        });

    }

    setupDragAndDrop() {
        // const containers = document.querySelectorAll(".cards-container");
        const containersHand = document.querySelectorAll(".cards-container-hand");

        // containers.forEach((container) => {
        //     container.addEventListener("dragover", this.handleDragOver.bind(this));
        //     container.addEventListener("drop", this.handleDrop.bind(this));
        //     container.addEventListener("dragenter", this.handleDragEnter.bind(this));
        //     container.addEventListener("dragleave", this.handleDragLeave.bind(this));
        // });

        containersHand.forEach((container) => {
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
            if (e.currentTarget.children.length == 0) window.app.moveCardToHand(cardId);
            else if (e.currentTarget.children[0].dataset.cardId == cardId) return;
            else {
                window.app.moveCardToDeck(e.currentTarget.children[0].dataset.cardId);
                window.app.moveCardToHand(cardId);
            }
            if (typeof window.app.chooseActiveCard === "function") {
                window.app.chooseActiveCard();
            }
        }
        // else if (targetContainer === "deck") {
        // }
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

        if (location === 'deck') {
            cardEl.classList.add('card-back');
            cardEl.innerHTML = `
                <div class="card-back-content">
                    <div class="card-back-pattern">🎴</div>
                    <div class="card-back-text">POKEMON TCG</div>
                </div>
            `;
        } else {
            cardEl.innerHTML = `
                <div class="card-info">
                    ${card.image
                    ? `<img src="${card.image}" alt="${card.name}" class="card-image full-cover" loading="lazy"
                            draggable="false"           
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">`
                    : ""
                }
                    <div class="card-placeholder" style="${card.image ? 'display:none' : ''}">
                        <div class="card-name">${card.name}</div>
                        <div class="card-type">${card.types?.[0]?.name || 'Unknown'}</div>
                    </div>
                </div>
            `;
        }

        cardEl.addEventListener("click", () => window.app.showCardDetails(card));
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
        const playerZone = document.getElementById('playerActiveCard');
        const opponentZone = document.getElementById('opponentActiveCard');
        const playerHP = document.getElementById('playerHP');
        const opponentName = document.getElementById('opponentName');
        const opponentHP = document.getElementById('opponentHP');
        const log = document.getElementById('battleLog');

        opponentName.textContent = battleState.opponentName || 'Adversaire';

        if (battleState.playerActiveCard) {
            playerZone.innerHTML = `
                <div class="battle-active-card">
                    <div class="battle-card-fallback" style="${battleState.playerActiveCard.image ? 'display:none' : ''}">
                        <div class="card-name">${battleState.playerActiveCard.name}</div>
                        <div class="card-type">${battleState.playerActiveCard.types?.[0] || 'Pokemon'}</div>
                    </div>
                    <div class="battle-card-name">${battleState.playerActiveCard.name}</div>
                    ${battleState.playerActiveCard.attacks?.length > 0
                    ? `<div class="battle-attacks-preview">
                             ${battleState.playerActiveCard.attacks.slice(0, 2).map(attack =>
                        `<small>${attack.name}: ${attack.damage || '?'}</small>`
                    ).join(' • ')}
                           </div>`
                    : '<small>Aucune attaque</small>'
                }
                </div>
            `;
            playerHP.textContent = battleState.playerHP;
            // const img = playerZone.querySelector('img, .battle-card-fallback');
            // if (img) {
            //     img.addEventListener('click', () => window.app.showCardDetails(battleState.playerActiveCard));
            // }
        }

        if (battleState.opponentActiveCard) {
            opponentZone.innerHTML = `
                <div class="battle-active-card">
                    ${battleState.opponentActiveCard.image
                    ? `<img src="${battleState.opponentActiveCard.image}" alt="${battleState.opponentActiveCard.name}"
                               class="battle-card-image" style="cursor:pointer;"
                               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">`
                    : ''
                }
                    <div class="battle-card-fallback" style="${battleState.opponentActiveCard.image ? 'display:none' : ''}">
                        <div class="card-name">${battleState.opponentActiveCard.name}</div>
                        <div class="card-type">${battleState.opponentActiveCard.types?.[0] || 'Pokemon'}</div>
                    </div>
                    <div class="battle-card-name">${battleState.opponentActiveCard.name}</div>
                    ${battleState.opponentActiveCard.attacks?.length > 0
                    ? `<div class="battle-attacks-preview">
                             ${battleState.opponentActiveCard.attacks.slice(0, 2).map(attack =>
                        `<small>${attack.name}: ${attack.damage || '?'}</small>`
                    ).join(' • ')}
                           </div>`
                    : '<small>Aucune attaque</small>'
                }
                </div>
            `;
            opponentHP.textContent = battleState.opponentHP;
            const img = opponentZone.querySelector('img, .battle-card-fallback');
            if (img) {
                img.addEventListener('click', () => window.app.showCardDetails(battleState.opponentActiveCard));
            }
        }

        if (log) {
            log.innerHTML = battleState.battleLog.slice(-6).map(l => `<div>${l}</div>`).join('');
        }
    }

    showChooseActiveModal(hand, onSelect) {
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
                <div class="choose-active-card">
                    ${card.image
                    ? `<img src="${card.image}" alt="${card.name}"
                               style="width:80px;height:110px;border-radius:8px;box-shadow:0 2px 8px #aaa;"
                               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">`
                    : ''
                }
                    <div class="card-fallback" style="${card.image ? 'display:none' : ''};text-align:center;padding:1rem;background:#f8f9fa;border-radius:8px;width:80px;height:110px;display:flex;flex-direction:column;justify-content:center;">
                        <div style="font-weight:bold;font-size:0.8rem;">${card.name}</div>
                        <div style="font-size:0.7rem;color:#666;">${card.types?.[0] || 'Pokemon'}</div>
                    </div>
                    <div style="margin-top:0.5rem;text-align:center;">
                        <div style="font-weight:bold;font-size:0.9rem;">${card.name}</div>
                        <div style="font-size:0.8rem;color:#666;">PV: ${card.getHP()}</div>
                        ${card.attacks?.length > 0
                    ? `<div style="font-size:0.7rem;color:#e74c3c;margin-top:0.2rem;">
                                 ${card.attacks.length} attaque${card.attacks.length > 1 ? 's' : ''}
                               </div>`
                    : '<div style="font-size:0.7rem;color:#999;">Aucune attaque</div>'
                }
                    </div>
                </div>
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
                ${attack.cost ? `<span style='color:#2980b9;font-size:0.9em;'>Coût : ${attack.cost.map(c => c.name || c).join(', ')}</span>` : ''}
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

    updateBoosterSelection(boosters, selectedType) {
        const boosterContainer = document.getElementById('boosterSelection');
        if (!boosterContainer) {
            this.createBoosterInterface();
            return this.updateBoosterSelection(boosters, selectedType);
        }

        const boosterGrid = boosterContainer.querySelector('.boosters-grid');
        boosterGrid.innerHTML = '';

        boosters.forEach(booster => {
            const boosterCard = this.createBoosterCard(booster, selectedType === booster.id);
            boosterGrid.appendChild(boosterCard);
        });
    }

    createBoosterInterface() {
        if (document.getElementById('boosterSelection')) {
            return;
        }

        const sidebarElement = document.querySelector('.sidebar') || document.querySelector('.action-panel').parentElement;

        const boosterSection = document.createElement('div');
        boosterSection.className = 'boosters-selection';
        boosterSection.id = 'boosterSelection';

        boosterSection.innerHTML = `
            <h3>🎴 Choisissez votre Booster</h3>
            <div class="boosters-grid"></div>
            <div class="booster-info">
                <p class="credits-display">💰 Crédits: <span id="creditsDisplay">0</span></p>
                <button class="btn" id="openSelectedBooster" onclick="app.openBooster()">
                    🎴 Ouvrir le Booster Sélectionné
                </button>
            </div>
        `;

        const firstActionPanel = sidebarElement.querySelector('.action-panel');
        if (firstActionPanel) {
            sidebarElement.insertBefore(boosterSection, firstActionPanel);
        } else {
            sidebarElement.appendChild(boosterSection);
        }
    }

    createBoosterCard(booster, isSelected) {
        const card = document.createElement('div');
        card.className = `booster-card ${booster.id} ${isSelected ? 'selected' : ''} ${!booster.affordable ? 'disabled' : ''}`;
        card.onclick = () => {
            if (booster.affordable) {
                window.app?.selectBoosterType(booster.id);
            }
        };

        const rareChance = Math.round(booster.rareChance * 100);
        const ultraRareChance = Math.round(booster.ultraRareChance * 100);
        const secretRareChance = Math.round(booster.secretRareChance * 100);

        card.innerHTML = `
            <div class="booster-effects"></div>
            <div class="booster-header">
                <span class="booster-icon">${booster.icon}</span>
                <span class="booster-name">${booster.name.replace(/^[🎴📦✨🔥🌟🎭]+\s*/, '')}</span>
                <span class="booster-price">${booster.price === 0 ? 'Gratuit' : booster.price + '💰'}</span>
            </div>
            <div class="booster-description">${booster.description}</div>
            <div class="booster-stats">
                <span class="card-count">📋 ${booster.cardCount === 0 ? '3-10' : booster.cardCount} cartes</span>
                <span class="rare-chance">💎 ${rareChance}% rare</span>
            </div>
            <div class="booster-details">
                <div class="chance-breakdown">
                    ${ultraRareChance > 0 ? `<span class="ultra-chance">⭐ ${ultraRareChance}% ultra</span>` : ''}
                    ${secretRareChance > 0 ? `<span class="secret-chance">🌟 ${secretRareChance}% secret</span>` : ''}
                </div>
                ${booster.cooldown > 0 ? '<div class="cooldown-info">⏰ Cooldown: 5min</div>' : ''}
            </div>
            ${isSelected ? '<div class="selected-indicator">✅ Sélectionné</div>' : ''}
        `;

        return card;
    }

    updateCreditsDisplay(credits) {
        const creditsDisplay = document.getElementById('creditsDisplay');
        if (creditsDisplay) {
            creditsDisplay.textContent = credits;
        }
    }

    showBoosterResult(result) {
        const resultModal = document.createElement('div');
        resultModal.className = 'booster-result-modal enhanced-modal';

        const rareCount = result.cards.filter(c => c.rarity?.name === 'Rare').length;
        const ultraRareCount = result.cards.filter(c => c.rarity?.name === 'Ultra Rare').length;
        const secretRareCount = result.cards.filter(c => c.rarity?.name === 'Secret Rare').length;
        const commonCount = result.cards.filter(c => c.rarity?.name === 'Common').length;
        const uncommonCount = result.cards.filter(c => c.rarity?.name === 'Uncommon').length;
        const sortedCards = [...result.cards].sort((a, b) => {
            const rarityOrder = { 'Secret Rare': 5, 'Ultra Rare': 4, 'Rare': 3, 'Uncommon': 2, 'Common': 1 };
            return (rarityOrder[b.rarity?.name] || 1) - (rarityOrder[a.rarity?.name] || 1);
        });
        window.currentBoosterCards = result.cards;

        resultModal.innerHTML = `
            <div class="enhanced-result-content" onclick="event.stopPropagation()">
                <button class="enhanced-close-btn" onclick="this.closest('.booster-result-modal').remove()">&times;</button>

                <div class="booster-result-header">
                    <div class="booster-type-badge ${result.boosterType}">
                        ${result.boosterType.charAt(0).toUpperCase() + result.boosterType.slice(1)} Pack
                    </div>
                    <h2>🎉 Félicitations ! 🎉</h2>
                    <p>Vous avez obtenu ${result.cards.length} nouvelles cartes !</p>
                </div>

                <div class="booster-stats-grid">
                    ${commonCount > 0 ? `<div class="stat-badge common"><span class="count">${commonCount}</span><span class="label">Communes</span></div>` : ''}
                    ${uncommonCount > 0 ? `<div class="stat-badge uncommon"><span class="count">${uncommonCount}</span><span class="label">Peu communes</span></div>` : ''}
                    ${rareCount > 0 ? `<div class="stat-badge rare"><span class="count">${rareCount}</span><span class="label">Rares</span></div>` : ''}
                    ${ultraRareCount > 0 ? `<div class="stat-badge ultra-rare"><span class="count">${ultraRareCount}</span><span class="label">Ultra Rares</span></div>` : ''}
                    ${secretRareCount > 0 ? `<div class="stat-badge secret-rare"><span class="count">${secretRareCount}</span><span class="label">Secrètes</span></div>` : ''}
                </div>

                <div class="enhanced-cards-grid">
                    ${sortedCards.map((card, index) => `
                        <div class="enhanced-card-item ${card.rarity?.name?.toLowerCase().replace(' ', '-') || 'common'}"
                             style="animation-delay: ${index * 0.1}s"
                             onclick="window.app.showCardDetails(window.currentBoosterCards[${result.cards.indexOf(card)}])">
                            ${card.image ? `
                                <img src="${card.image}" alt="${card.name}" class="enhanced-card-image"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            ` : ''}
                            <div class="enhanced-card-placeholder" style="${card.image ? 'display:none;' : 'display:flex;'}">
                                <div class="card-icon">🎴</div>
                                <div class="card-name-short">${card.name.length > 12 ? card.name.substring(0, 12) + '...' : card.name}</div>
                            </div>
                            <div class="enhanced-card-overlay">
                                <div class="card-name-full">${card.name}</div>
                                <div class="card-rarity-badge ${card.rarity?.name?.toLowerCase().replace(' ', '-') || 'common'}">
                                    ${card.rarity?.name || 'Common'}
                                </div>
                                ${card.types && card.types.length > 0 ? `
                                    <div class="card-type-badge">
                                        ${card.types[0].name || card.types[0]}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="card-shine-effect"></div>
                        </div>
                    `).join('')}
                </div>

                <div class="booster-result-actions">
                    <button class="btn-action btn-add-all" onclick="window.app.addCardsToDeck(window.currentBoosterCards); this.closest('.booster-result-modal').remove();">
                        ➕ Ajouter toutes au Deck
                    </button>
                    <button class="btn-action btn-view-collection" onclick="window.location.href='collection.html'">
                        📚 Voir la Collection
                    </button>
                    <button class="btn-action btn-close-modal" onclick="this.closest('.booster-result-modal').remove()">
                        ✨ Fermer
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(resultModal);

        resultModal.addEventListener('click', () => {
            resultModal.remove();
            delete window.currentBoosterCards;
        });

        setTimeout(() => {
            resultModal.classList.add('show');
        }, 50);

        setTimeout(() => {
            if (resultModal.parentElement) {
                resultModal.classList.add('fade-out');
                setTimeout(() => {
                    if (resultModal.parentElement) {
                        resultModal.remove();
                        delete window.currentBoosterCards;
                    }
                }, 500);
            }
        }, 30000);
    }

    setRating(rating) {
        const stars = document.querySelectorAll("#rating-stars .star");
        stars.forEach((star, index) => {
            star.classList.toggle("active", index < rating);
        });
        window.app.setSelectedRating(rating);
    }
}