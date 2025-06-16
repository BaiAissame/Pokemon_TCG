// service/CardAnimationService.js
class CardAnimationService {
    constructor() {
        this.animationContainer = null;
        this.isAnimating = false;
    }

    init() {
        if (!document.getElementById('cardAnimationContainer')) {
            const container = document.createElement('div');
            container.id = 'cardAnimationContainer';
            container.className = 'card-animation-container';
            document.body.appendChild(container);
            this.animationContainer = container;
        }
    }

    async playBoosterOpenAnimation(boosterType, cards) {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.init();

        try {
            await this.playInteractiveBoosterAnimation(boosterType, cards);
        } finally {
            this.isAnimating = false;
        }
    }

    async playInteractiveBoosterAnimation(boosterType, cards) {
        this.animationContainer.innerHTML = `
            <div class="interactive-booster-opening">
                <div class="booster-header">
                    <h2>🎴 ${this.getBoosterTitle(boosterType)}</h2>
                    <p>Cliquez sur les cartes pour les révéler!</p>
                </div>
                <div class="cards-grid" id="interactiveCardsGrid">
                    <!-- Les cartes seront ajoutées ici -->
                </div>
                <div class="booster-actions">
                    <button id="addAllToDeck" class="btn-add-deck" style="display: none;">
                        ➕ Ajouter toutes les cartes au deck
                    </button>
                    <button id="closeBooster" class="btn-close-booster">
                        ❌ Fermer
                    </button>
                </div>
            </div>
        `;

        this.animationContainer.style.display = 'flex';

        const cardsGrid = document.getElementById('interactiveCardsGrid');
        let revealedCount = 0;

        cards.forEach((card, index) => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'interactive-card-container';
            cardContainer.innerHTML = `
                <div class="interactive-card" data-card-index="${index}">
                    <div class="card-inner">
                        <div class="card-back">
                            <div class="card-back-pattern">🎴</div>
                        </div>
                        <div class="card-front" style="display: none;">
                            ${card.image ?
                                `<img src="${card.image}" alt="${card.name}" class="card-image">` :
                                `<div class="card-placeholder">${card.name}</div>`
                            }
                        </div>
                    </div>
                </div>
            `;

            const cardElement = cardContainer.querySelector('.interactive-card');
            cardElement.addEventListener('click', () => {
                if (!cardElement.classList.contains('revealed')) {
                    this.revealCard(cardElement, card);
                    revealedCount++;
                    if (revealedCount === cards.length) {
                        document.getElementById('addAllToDeck').style.display = 'block';
                    }
                }
            });

            cardsGrid.appendChild(cardContainer);
        });

        document.getElementById('addAllToDeck').addEventListener('click', () => {
            this.addCardsToCurrentDeck(cards);
            this.hideAnimation();
        });

        document.getElementById('closeBooster').addEventListener('click', () => {
            this.hideAnimation();
        });

        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target === this.animationContainer &&
                        this.animationContainer.style.display === 'none') {
                        observer.disconnect();
                        resolve();
                    }
                });
            });
            observer.observe(this.animationContainer, { attributes: true, attributeFilter: ['style'] });
        });
    }

    revealCard(cardElement, cardData) {
        cardElement.classList.add('revealed');

        cardElement.style.transform = 'rotateY(180deg)';

        setTimeout(() => {
            const cardBack = cardElement.querySelector('.card-back');
            const cardFront = cardElement.querySelector('.card-front');

            cardBack.style.display = 'none';
            cardFront.style.display = 'block';
            cardElement.style.transform = 'rotateY(0deg)';

            this.addRarityEffect(cardElement, cardData.rarity?.name);
        }, 200);
    }

    addRarityEffect(cardElement, rarity) {
        switch (rarity) {
            case 'Rare':
                cardElement.classList.add('rare-glow');
                break;
            case 'Ultra Rare':
                cardElement.classList.add('ultra-rare-glow');
                break;
            case 'Secret Rare':
                cardElement.classList.add('secret-rare-glow');
                break;
        }
    }

    addCardsToCurrentDeck(cards) {
        if (window.app && window.app.addCardsToDeck) {
            window.app.addCardsToDeck(cards);
        } else if (window.battleApp && window.battleApp.addCardsToDeck) {
            window.battleApp.addCardsToDeck(cards);
        }
        this.showSuccessMessage(`🎉 ${cards.length} cartes ajoutées au deck !`);
    }

    showSuccessMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'success-toast';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #27ae60, #229954);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-weight: bold;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    getBoosterTitle(boosterType) {
        const titles = {
            'standard': 'Booster Standard',
            'premium': 'Booster Premium ✨',
            'themed': 'Pack Thématique 🔥',
            'legendary': 'Pack Légendaire 🌟',
            'mystery': 'Pack Mystère 🎭'
        };
        return titles[boosterType] || 'Booster';
    }

    async playStandardAnimation(cards) {
        this.animationContainer.innerHTML = `
            <div class="booster-animation standard-booster">
                <div class="booster-pack">
                    <div class="pack-front">📦</div>
                    <div class="pack-opening">✨</div>
                </div>
                <div class="cards-reveal"></div>
                <div class="animation-overlay">
                    <h2>🎴 Ouverture du Booster Standard!</h2>
                </div>
            </div>
        `;

        this.animationContainer.style.display = 'flex';

        await this.sleep(500);
        this.animationContainer.querySelector('.pack-front').style.transform = 'rotateY(180deg)';

        await this.sleep(800);

        const cardsReveal = this.animationContainer.querySelector('.cards-reveal');
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardElement = this.createAnimatedCard(card, i);
            cardsReveal.appendChild(cardElement);

            await this.sleep(300);
            cardElement.classList.add('revealed');
        }

        await this.sleep(2000);
        this.hideAnimation();
    }

    async playPremiumAnimation(cards) {
        this.animationContainer.innerHTML = `
            <div class="booster-animation premium-booster">
                <div class="premium-effects">
                    <div class="golden-sparkles"></div>
                    <div class="premium-aura"></div>
                </div>
                <div class="booster-pack premium-pack">
                    <div class="pack-front">💎</div>
                    <div class="pack-opening">✨</div>
                </div>
                <div class="cards-reveal premium-reveal"></div>
                <div class="animation-overlay premium-overlay">
                    <h2>✨ Pack Premium Ouvert! ✨</h2>
                    <p>Cartes rares garanties!</p>
                </div>
            </div>
        `;

        this.animationContainer.style.display = 'flex';

        this.addGoldenParticles();

        await this.sleep(1000);
        this.animationContainer.querySelector('.pack-front').style.transform = 'rotateY(180deg)';

        await this.sleep(1000);

        const cardsReveal = this.animationContainer.querySelector('.cards-reveal');
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardElement = this.createAnimatedCard(card, i, true);
            cardsReveal.appendChild(cardElement);

            if (card.rarity?.name === 'Rare' || card.rarity?.name === 'Ultra Rare' || card.rarity?.name === 'Secret Rare') {
                this.addRareCardEffect(cardElement, card.rarity.name);
            }

            await this.sleep(400);
            cardElement.classList.add('revealed');
        }

        await this.sleep(3000);
        this.hideAnimation();
    }

    async playThemedAnimation(cards) {
        const mainType = this.getMainTheme(cards);
        const themeData = this.getThemeAnimationData(mainType);

        this.animationContainer.innerHTML = `
            <div class="booster-animation themed-booster ${mainType.toLowerCase()}-theme">
                <div class="theme-background">
                    <div class="theme-particles"></div>
                </div>
                <div class="booster-pack themed-pack">
                    <div class="pack-front">${themeData.icon}</div>
                    <div class="pack-opening">${themeData.effect}</div>
                </div>
                <div class="cards-reveal themed-reveal"></div>
                <div class="animation-overlay themed-overlay">
                    <h2>${themeData.icon} Pack ${mainType} ${themeData.icon}</h2>
                    <p>${themeData.description}</p>
                </div>
            </div>
        `;

        this.animationContainer.style.display = 'flex';
        this.addThemeParticles(mainType);

        await this.sleep(800);
        this.animationContainer.querySelector('.pack-front').style.transform = 'rotateY(180deg)';

        await this.sleep(1000);

        const cardsReveal = this.animationContainer.querySelector('.cards-reveal');
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardElement = this.createAnimatedCard(card, i);
            cardElement.classList.add('themed-card');
            cardsReveal.appendChild(cardElement);

            await this.sleep(350);
            cardElement.classList.add('revealed');
        }

        await this.sleep(2500);
        this.hideAnimation();
    }

    async playLegendaryAnimation(cards) {
        this.animationContainer.innerHTML = `
            <div class="booster-animation legendary-booster">
                <div class="legendary-effects">
                    <div class="golden-rays"></div>
                    <div class="legendary-aura"></div>
                    <div class="stars-field"></div>
                </div>
                <div class="booster-pack legendary-pack">
                    <div class="pack-front">👑</div>
                    <div class="pack-opening">🌟</div>
                </div>
                <div class="cards-reveal legendary-reveal"></div>
                <div class="animation-overlay legendary-overlay">
                    <h2>🌟 PACK LÉGENDAIRE! 🌟</h2>
                    <p>Des cartes d'une puissance incommensurable!</p>
                </div>
            </div>
        `;

        this.animationContainer.style.display = 'flex';
        this.addLegendaryEffects();

        await this.sleep(1200);
        this.animationContainer.querySelector('.pack-front').style.transform = 'rotateY(180deg) scale(1.2)';

        await this.sleep(1500);

        const cardsReveal = this.animationContainer.querySelector('.cards-reveal');
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardElement = this.createAnimatedCard(card, i, true);
            cardElement.classList.add('legendary-card');
            cardsReveal.appendChild(cardElement);

            this.addLegendaryCardEffect(cardElement);

            await this.sleep(500);
            cardElement.classList.add('revealed');
        }

        await this.sleep(4000);
        this.hideAnimation();
    }

    async playMysteryAnimation(cards) {
        this.animationContainer.innerHTML = `
            <div class="booster-animation mystery-booster">
                <div class="mystery-effects">
                    <div class="question-marks"></div>
                    <div class="mystery-fog"></div>
                </div>
                <div class="booster-pack mystery-pack">
                    <div class="pack-front">❓</div>
                    <div class="pack-opening">🎭</div>
                </div>
                <div class="cards-reveal mystery-reveal"></div>
                <div class="animation-overlay mystery-overlay">
                    <h2>🎭 Pack Mystère! 🎭</h2>
                    <p>Combien de cartes allez-vous obtenir?</p>
                    <div class="card-counter">? cartes</div>
                </div>
            </div>
        `;

        this.animationContainer.style.display = 'flex';
        this.addMysteryEffects();

        const counter = this.animationContainer.querySelector('.card-counter');
        for (let i = 1; i <= cards.length; i++) {
            counter.textContent = `${i} carte${i > 1 ? 's' : ''}`;
            await this.sleep(200);
        }

        await this.sleep(800);
        this.animationContainer.querySelector('.pack-front').style.transform = 'rotateY(180deg)';

        await this.sleep(1000);

        const cardsReveal = this.animationContainer.querySelector('.cards-reveal');
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardElement = this.createAnimatedCard(card, i);
            cardElement.classList.add('mystery-card');
            cardsReveal.appendChild(cardElement);

            await this.sleep(300);
            cardElement.classList.add('revealed');
        }

        await this.sleep(2000);
        this.hideAnimation();
    }

    createAnimatedCard(card, index, premium = false) {
        const cardEl = document.createElement('div');
        cardEl.className = `animated-card ${premium ? 'premium' : ''}`;
        cardEl.style.animationDelay = `${index * 0.1}s`;

        const rarityClass = this.getRarityClass(card.rarity?.name);
        cardEl.classList.add(rarityClass);

        cardEl.innerHTML = `
            <div class="card-inner">
                <div class="card-back">
                    <div class="card-back-pattern">🎴</div>
                </div>
                <div class="card-front">
                    ${card.image ?
                        `<img src="${card.image}" alt="${card.name}" class="card-image">` :
                        `<div class="card-placeholder">${card.name}</div>`
                    }
                    <div class="card-info">
                        <div class="card-name">${card.name}</div>
                        <div class="card-rarity ${rarityClass}">${card.rarity?.name || 'Common'}</div>
                    </div>
                    ${card.themeBonus ? '<div class="theme-bonus">🎯</div>' : ''}
                    ${card.legendaryBonus ? '<div class="legendary-bonus">👑</div>' : ''}
                </div>
            </div>
        `;

        return cardEl;
    }

    getRarityClass(rarity) {
        switch (rarity) {
            case 'Secret Rare': return 'secret-rare';
            case 'Ultra Rare': return 'ultra-rare';
            case 'Rare': return 'rare';
            case 'Uncommon': return 'uncommon';
            default: return 'common';
        }
    }

    getMainTheme(cards) {
        const typeCount = {};
        cards.forEach(card => {
            if (card.types && card.types.length > 0) {
                const type = card.types[0].name;
                typeCount[type] = (typeCount[type] || 0) + 1;
            }
        });

        return Object.keys(typeCount).reduce((a, b) =>
            typeCount[a] > typeCount[b] ? a : b
        ) || 'Colorless';
    }

    getThemeAnimationData(type) {
        const themes = {
            'Fire': { icon: '🔥', effect: '🔥', description: 'La puissance du feu!' },
            'Water': { icon: '💧', effect: '🌊', description: 'La force des océans!' },
            'Grass': { icon: '🌿', effect: '🍃', description: 'La vitalité de la nature!' },
            'Lightning': { icon: '⚡', effect: '⚡', description: 'L\'énergie électrique!' },
            'Psychic': { icon: '🔮', effect: '✨', description: 'Les pouvoirs psychiques!' },
            'Fighting': { icon: '👊', effect: '💥', description: 'La force brute!' },
            'Darkness': { icon: '🌙', effect: '🌟', description: 'Les ténèbres mystérieuses!' },
            'Metal': { icon: '⚔️', effect: '✨', description: 'La résistance de l\'acier!' },
            'Dragon': { icon: '🐉', effect: '🔥', description: 'La majesté des dragons!' }
        };

        return themes[type] || { icon: '🎴', effect: '✨', description: 'Cartes mystérieuses!' };
    }

    addGoldenParticles() {
        const particles = this.animationContainer.querySelector('.golden-sparkles');
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'golden-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particles.appendChild(particle);
        }
    }

    addThemeParticles(type) {
        const particles = this.animationContainer.querySelector('.theme-particles');
        const particleChar = this.getThemeAnimationData(type).effect;

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'theme-particle';
            particle.textContent = particleChar;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 3 + 's';
            particles.appendChild(particle);
        }
    }

    addLegendaryEffects() {
        const rays = this.animationContainer.querySelector('.golden-rays');
        for (let i = 0; i < 8; i++) {
            const ray = document.createElement('div');
            ray.className = 'golden-ray';
            ray.style.transform = `rotate(${i * 45}deg)`;
            rays.appendChild(ray);
        }

        const stars = this.animationContainer.querySelector('.stars-field');
        for (let i = 0; i < 30; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.textContent = '⭐';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 4 + 's';
            stars.appendChild(star);
        }
    }

    addMysteryEffects() {
        const questionMarks = this.animationContainer.querySelector('.question-marks');
        const symbols = ['❓', '❔', '⁉️'];

        for (let i = 0; i < 12; i++) {
            const symbol = document.createElement('div');
            symbol.className = 'mystery-symbol';
            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            symbol.style.left = Math.random() * 100 + '%';
            symbol.style.animationDelay = Math.random() * 2 + 's';
            questionMarks.appendChild(symbol);
        }
    }

    addRareCardEffect(cardElement, rarity) {
        const effect = document.createElement('div');
        effect.className = `rarity-effect ${this.getRarityClass(rarity)}`;

        switch (rarity) {
            case 'Secret Rare':
                effect.innerHTML = '🌟'.repeat(5);
                break;
            case 'Ultra Rare':
                effect.innerHTML = '✨'.repeat(4);
                break;
            case 'Rare':
                effect.innerHTML = '💎'.repeat(3);
                break;
        }

        cardElement.appendChild(effect);
    }

    addLegendaryCardEffect(cardElement) {
        const effect = document.createElement('div');
        effect.className = 'legendary-card-effect';
        effect.innerHTML = '👑⚡🌟';
        cardElement.appendChild(effect);
    }

    hideAnimation() {
        setTimeout(() => {
            if (this.animationContainer) {
                this.animationContainer.style.display = 'none';
                this.animationContainer.innerHTML = '';
            }
        }, 500);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    playComboEffect(comboType) {
        if (!this.animationContainer) return;

        const comboOverlay = document.createElement('div');
        comboOverlay.className = 'combo-overlay';

        switch (comboType) {
            case 'tripleRare':
                comboOverlay.innerHTML = `
                    <div class="combo-text">
                        <h1>🔥 TRIPLE RARE! 🔥</h1>
                        <p>Combo incroyable!</p>
                    </div>
                `;
                break;
            case 'secretCombo':
                comboOverlay.innerHTML = `
                    <div class="combo-text">
                        <h1>🌟 SECRET RARE! 🌟</h1>
                        <p>Carte ultra-secrète débloquée!</p>
                    </div>
                `;
                break;
        }

        this.animationContainer.appendChild(comboOverlay);

        setTimeout(() => {
            comboOverlay.remove();
        }, 3000);
    }
}

export default CardAnimationService;
