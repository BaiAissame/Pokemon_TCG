// service/BoosterService.js
class BoosterService {
    constructor(pokemonAPI, soundService) {
        this.pokemonAPI = pokemonAPI;
        this.soundService = soundService;
        this.lastSpecialPack = null;

        this.boosterTypes = {
            standard: {
                name: '📦 Booster Standard',
                price: 0,
                cardCount: 5,
                rareChance: 0.15,
                ultraRareChance: 0.03,
                secretRareChance: 0.01,
                description: 'Un pack classique avec des cartes variées',
                icon: '🎴',
                cooldown: 5 * 60 * 1000,
                animation: 'standard'
            },
            premium: {
                name: '✨ Booster Premium',
                price: 50,
                cardCount: 7,
                rareChance: 0.35,
                ultraRareChance: 0.08,
                secretRareChance: 0.03,
                description: 'Pack premium avec plus de cartes rares garanties',
                icon: '💎',
                cooldown: 0,
                animation: 'premium'
            },
            themed: {
                name: '🔥 Pack Thématique',
                price: 30,
                cardCount: 6,
                rareChance: 0.25,
                ultraRareChance: 0.05,
                secretRareChance: 0.02,
                description: 'Pack centré sur un type spécifique de Pokémon',
                icon: '🎯',
                cooldown: 0,
                animation: 'themed'
            },
            legendary: {
                name: '🌟 Pack Légendaire',
                price: 100,
                cardCount: 10,
                rareChance: 0.50,
                ultraRareChance: 0.15,
                secretRareChance: 0.08,
                description: 'Pack rare avec des cartes légendaires garanties',
                icon: '👑',
                cooldown: 0,
                animation: 'legendary'
            },
            mystery: {
                name: '🎭 Pack Mystère',
                price: 25,
                cardCount: 0,
                rareChance: 0.20,
                ultraRareChance: 0.10,
                secretRareChance: 0.05,
                description: 'Pack surprise avec un nombre de cartes aléatoire',
                icon: '❓',
                cooldown: 0,
                animation: 'mystery'
            }
        };

        this.themes = [
            { name: 'Fire', icon: '🔥', types: ['Fire'] },
            { name: 'Water', icon: '💧', types: ['Water'] },
            { name: 'Grass', icon: '🌿', types: ['Grass'] },
            { name: 'Electric', icon: '⚡', types: ['Lightning'] },
            { name: 'Psychic', icon: '🔮', types: ['Psychic'] },
            { name: 'Fighting', icon: '👊', types: ['Fighting'] },
            { name: 'Dark', icon: '🌙', types: ['Darkness'] },
            { name: 'Steel', icon: '⚔️', types: ['Metal'] },
            { name: 'Dragon', icon: '🐉', types: ['Dragon'] }
        ];
    }

    getAvailableBoosters(credits) {
        return Object.entries(this.boosterTypes).map(([key, booster]) => ({
            id: key,
            ...booster,
            affordable: credits >= booster.price,
            available: key === 'standard' ? true : true
        }));
    }

    async openBooster(boosterType, gameState) {
        const booster = this.boosterTypes[boosterType];
        if (!booster) throw new Error('Type de booster inconnu');

        if (gameState.credits < booster.price) {
            throw new Error('Crédits insuffisants');
        }

        gameState.credits -= booster.price;

        let cardCount = booster.cardCount;
        if (boosterType === 'mystery') {
            cardCount = Math.floor(Math.random() * 8) + 3;
        }

        let cards = [];
        switch (boosterType) {
            case 'themed':
                cards = await this.generateThemedCards(cardCount, booster);
                break;
            case 'legendary':
                cards = await this.generateLegendaryCards(cardCount, booster);
                break;
            default:
                cards = await this.generateStandardCards(cardCount, booster);
        }

        this.soundService?.playSound(`booster_${boosterType}` || 'cardDraw');

        return {
            cards,
            boosterType,
            animation: booster.animation,
            specialEffects: this.getSpecialEffects(cards, boosterType)
        };
    }

    async generateStandardCards(count, boosterConfig) {

        try {
            const apiCards = await this.pokemonAPI.getRandomCards(count);

            return this.applyRarityLogic(apiCards, boosterConfig);

        } catch (error) {
            console.warn('❌ BoosterService: Fallback pour les cartes standard:', error);
            const fallbackCards = this.pokemonAPI.generateFallbackCards(count);
            return this.applyRarityLogic(fallbackCards, boosterConfig);
        }
    }

    async generateThemedCards(count, boosterConfig) {
        const theme = this.themes[Math.floor(Math.random() * this.themes.length)];

        try {
            let cards = [];
            for (let i = 0; i < count; i++) {
                try {
                    const themeCards = await this.pokemonAPI.getRandomCards(10);
                    const typeCard = themeCards.find(card =>
                        card.types && card.types.some(type =>
                            theme.types.includes(type.name)
                        )
                    );

                    if (typeCard) {
                        cards.push({
                            ...typeCard,
                            id: `${typeCard.id}-themed-${Date.now()}-${i}`,
                            themeBonus: true
                        });
                    } else {
                        cards.push(themeCards[0]);
                    }
                } catch {
                    const fallbackCard = this.generateThemedFallbackCard(theme, i);
                    cards.push(fallbackCard);
                }
            }

            return this.applyRarityLogic(cards, boosterConfig);

        } catch (error) {
            console.warn('Fallback pour pack thématique:', error);
            return this.generateThemedFallbackPack(count, theme, boosterConfig);
        }
    }

    generateThemedFallbackCard(theme, index) {
        const pokemonNames = [
            'Charizard', 'Blastoise', 'Venusaur', 'Pikachu', 'Alakazam',
            'Gengar', 'Machamp', 'Dragonite', 'Mewtwo', 'Mew'
        ];

        const name = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
        const hp = Math.floor(Math.random() * 150) + 80;
        const attackPower = Math.floor(Math.random() * 80) + 40;

        return {
            id: `themed-fallback-${Date.now()}-${index}`,
            name: `${theme.name} ${name}`,
            types: [{ name: theme.types[0] }],
            hp,
            attacks: [{
                name: `${theme.name} Blast`,
                damage: attackPower,
                cost: [{ name: theme.types[0] }],
                text: `Une attaque puissante de type ${theme.name}.`
            }],
            rarity: { name: 'Uncommon' },
            set: { name: `${theme.name} Collection`, id: `${theme.name.toLowerCase()}-set` },
            image: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}-${theme.name}&backgroundColor=${this.getThemeColor(theme.name)}`,
            artist: 'Themed Artist',
            themeBonus: true,
            description: `${name} spécialisé dans le type ${theme.name}.`
        };
    }

    generateThemedFallbackPack(count, theme, boosterConfig) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            cards.push(this.generateThemedFallbackCard(theme, i));
        }
        return this.applyRarityLogic(cards, boosterConfig);
    }

    async generateLegendaryCards(count, boosterConfig) {
        try {
            const cards = await this.pokemonAPI.getRandomCards(count * 2);

            const selectedCards = cards
                .sort((a, b) => (b.hp || 0) - (a.hp || 0))
                .slice(0, count)
                .map((card, index) => ({
                    ...card,
                    id: `${card.id}-legendary-${Date.now()}-${index}`,
                    legendaryBonus: true
                }));

            return this.applyRarityLogic(selectedCards, boosterConfig);

        } catch (error) {
            console.warn('Fallback pour pack légendaire:', error);
            return this.generateLegendaryFallbackPack(count, boosterConfig);
        }
    }

    generateLegendaryFallbackPack(count, boosterConfig) {
        const legendaryNames = [
            'Arceus', 'Dialga', 'Palkia', 'Giratina', 'Lugia', 'Ho-Oh',
            'Rayquaza', 'Kyogre', 'Groudon', 'Mewtwo', 'Mew', 'Celebi'
        ];

        const cards = [];
        for (let i = 0; i < count; i++) {
            const name = legendaryNames[Math.floor(Math.random() * legendaryNames.length)];
            const hp = Math.floor(Math.random() * 100) + 120;
            const attackPower = Math.floor(Math.random() * 60) + 80;

            cards.push({
                id: `legendary-fallback-${Date.now()}-${i}`,
                name,
                types: [{ name: this.getRandomType() }],
                hp,
                attacks: [{
                    name: 'Legendary Strike',
                    damage: attackPower,
                    cost: [{ name: this.getRandomType() }],
                    text: `${name} déchaîne sa puissance légendaire.`
                }],
                rarity: { name: Math.random() > 0.5 ? 'Ultra Rare' : 'Secret Rare' },
                set: { name: 'Legendary Collection', id: 'legendary-set' },
                image: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=gold`,
                artist: 'Legendary Artist',
                legendaryBonus: true,
                description: `${name}, un Pokémon légendaire d'une puissance incommensurable.`
            });
        }

        return this.applyRarityLogic(cards, boosterConfig);
    }

    applyRarityLogic(cards, boosterConfig) {
        return cards.map(card => {
            const rand = Math.random();

            if (rand < boosterConfig.secretRareChance) {
                card.rarity = { name: 'Secret Rare' };
                card.rarityBonus = 'secret';
            } else if (rand < boosterConfig.secretRareChance + boosterConfig.ultraRareChance) {
                card.rarity = { name: 'Ultra Rare' };
                card.rarityBonus = 'ultra';
            } else if (rand < boosterConfig.secretRareChance + boosterConfig.ultraRareChance + boosterConfig.rareChance) {
                card.rarity = { name: 'Rare' };
                card.rarityBonus = 'rare';
            } else {
                card.rarity = card.rarity || { name: Math.random() > 0.5 ? 'Uncommon' : 'Common' };
            }

            return card;
        });
    }

    getSpecialEffects(cards, boosterType) {
        const effects = [];

        const rareCount = cards.filter(card =>
            card.rarity?.name === 'Rare' ||
            card.rarity?.name === 'Ultra Rare' ||
            card.rarity?.name === 'Secret Rare'
        ).length;

        if (rareCount >= 3) {
            effects.push('multiRare');
        }

        if (cards.some(card => card.rarity?.name === 'Secret Rare')) {
            effects.push('secretRare');
        }

        if (boosterType === 'legendary') {
            effects.push('legendary');
        }

        if (boosterType === 'mystery') {
            effects.push('mystery');
        }

        return effects;
    }

    getThemeColor(themeName) {
        const colors = {
            'Fire': 'red',
            'Water': 'blue',
            'Grass': 'green',
            'Electric': 'yellow',
            'Psychic': 'purple',
            'Fighting': 'brown',
            'Dark': 'black',
            'Steel': 'gray',
            'Dragon': 'orange'
        };
        return colors[themeName] || 'random';
    }

    getRandomType() {
        const types = ['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Colorless'];
        return types[Math.floor(Math.random() * types.length)];
    }

    calculateStreakBonus(consecutiveOpens) {
        if (consecutiveOpens >= 10) {
            return { type: 'legendary', message: 'Bonus Légendaire! Pack gratuit!' };
        } else if (consecutiveOpens >= 5) {
            return { type: 'rare', message: 'Bonus Rare! Cartes rares garanties!' };
        } else if (consecutiveOpens >= 3) {
            return { type: 'common', message: 'Combo! +20% chances de cartes rares!' };
        }
        return null;
    }
    getSpecialEvent() {
        const events = [
            {
                name: 'Double XP Weekend',
                description: 'Doublez vos gains d\'expérience!',
                effect: 'double_xp',
                active: Math.random() > 0.8
            },
            {
                name: 'Rare Boost',
                description: '+50% de chances de cartes rares!',
                effect: 'rare_boost',
                active: Math.random() > 0.9
            },
            {
                name: 'Free Premium',
                description: 'Premier pack premium gratuit!',
                effect: 'free_premium',
                active: Math.random() > 0.95
            }
        ];

        return events.find(event => event.active) || null;
    }
}

export default BoosterService;
