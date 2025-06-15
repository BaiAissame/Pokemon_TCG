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
        console.log(
            `Carte ${data.card.name} déplacée de ${data.from} vers ${data.to}`
        );
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

      cardDetail.innerHTML = `
                  ${card.image
          ? `<img src="${card.image}" alt="${card.name}" style="max-width: 400px;">`
          : ""
        }
          `;

      modal.style.display = "block";
    }

    
   
}