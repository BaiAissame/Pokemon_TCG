// views/GameView.js
class GameView {
  onStateChange(gameState) {
    this.updateDisplay(gameState);
  }

  updateDisplay(gameState) {
    this.updateTrainersList(gameState.trainers);
  }

  updateTimer(gameState) {
    const timerEl = document.getElementById("drawTimer");
    if (!timerEl) return;

    if (gameState.canDrawCards()) {
      timerEl.textContent = "⚡ Prêt à tirer!";
      timerEl.className = "timer ready";
    } else {
      const remainingTime = gameState.getRemainingTime();
      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      timerEl.textContent = `⏰ ${minutes}:${seconds.toString().padStart(2, '0')}`;
      timerEl.className = "timer waiting";
    }
  }

  showMessage(message, type) {
    const messageEl = document.getElementById("message");
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `message ${type}`;

      setTimeout(() => {
        messageEl.textContent = "";
        messageEl.className = "message";
      }, 5000);
    }
  }

  showLoading(show) {
    const loadingEl = document.getElementById("loading");
    if (loadingEl) {
      loadingEl.className = show ? "loading show" : "loading";
    }
  }

  onError(message) {
    this.showMessage(message, "error");
  }

  showCardDetails(card) {
    const modal = document.getElementById("cardModal");
    const cardDetail = document.getElementById("cardDetail");

    if (!modal || !cardDetail) return;

    cardDetail.innerHTML = `
      <div style="max-width: 500px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 1rem;">
          <h3 style="color: #2c3e50; margin-bottom: 0.8rem; font-size: 1.3em;">
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
              ">
                ⭐ ${card.types.map(t => t.name || t).slice(0, 2).join(', ')}
              </div>
            ` : ''}
          </div>
        </div>

        ${card.attacks && card.attacks.length > 0 ? `
          <div style="margin-top: 1rem;">
            <h4 style="color: #e74c3c; margin-bottom: 0.8rem; font-size: 1.1em;">⚔️ Attaques</h4>
            <div style="display: grid; gap: 0.6rem; max-height: 200px; overflow-y: auto;">
              ${card.attacks.slice(0, 4).map(attack => `
                <div style="
                  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                  border: 1px solid #dee2e6;
                  border-radius: 8px;
                  padding: 0.6rem;
                ">
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
                  ${attack.text ? `
                    <div style="
                      font-size: 0.75em;
                      color: #2c3e50;
                      line-height: 1.3;
                      margin-top: 0.3rem;
                    ">
                      ${attack.text.length > 60 ? attack.text.substring(0, 60) + '...' : attack.text}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    modal.style.display = "block";
  }

  updateTrainersList(trainers) {
    const trainersListEl = document.getElementById("trainersList");
    if (!trainersListEl) return;

    trainersListEl.innerHTML = "";

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
      return;
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

      trainerEl.addEventListener("click", () => {
        localStorage.setItem("selectedTrainer", JSON.stringify(trainer));
        window.location.href = trainerEl.action
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

  // setRating(rating) {
  //   const stars = document.querySelectorAll(".star");
  //   stars.forEach((star, index) => {
  //     star.classList.toggle("active", index < rating);
  //   });
  //   window.app.setSelectedRating(rating);
  // }

  closeModal() {
    document.getElementById("cardModal").style.display = "none";
  }


  createBoosterInterface() {
      if (document.getElementById('boosterSelection')) {
          return;
      }

      const sidebarElement = document.querySelector('.sidebar');
      if (!sidebarElement) return;

      const boosterSection = document.createElement('div');
      boosterSection.className = 'boosters-selection';
      boosterSection.id = 'boosterSelection';

      boosterSection.innerHTML = `
          <h3>🎴 Choisissez votre Booster</h3>
          <div class="boosters-grid"></div>
          <div class="booster-info">
              <p class="credits-display">💰 Crédits: <span id="creditsDisplay">0</span></p>
          </div>
      `;

      const firstActionPanel = sidebarElement.querySelector('.action-panel');
      if (firstActionPanel) {
          sidebarElement.insertBefore(boosterSection, firstActionPanel);
      } else {
          sidebarElement.appendChild(boosterSection);
      }
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

      const headerCredits = document.getElementById('credits');
      if (headerCredits) {
          headerCredits.textContent = credits;
      }
  }

  onCollectionUpdated(collection) {
      this.showMessage(`🎉 Collection mise à jour! ${collection.length} cartes au total`, 'success');
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
          <div class="enhanced-result-content" onclick="event.stopPropagation()">                <button class="enhanced-close-btn" onclick="this.closest('.booster-result-modal').remove(); delete window.currentBoosterCards;">&times;</button>

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
                  </button>                    <button class="btn-action btn-close-modal" onclick="this.closest('.booster-result-modal').remove(); delete window.currentBoosterCards;">
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
}

export default GameView;
