// service/PokemonTCGAPIService.js - Implémentation optimisée pour l'API Pokemon TCG officielle v2
export default class PokemonTCGAPIService {
    constructor() {
        this.baseURL = 'https://api.pokemontcg.io/v2/';
        this.apiKey = '4399594e-a2a0-414e-ae59-6b24e72e0a80';
        this.cache = new Map();
        this.availableSets = [];
        this.availableSeries = [];
        this.apiAvailable = false;
        this.isInitializing = true;
        this.initPromise = null;

        this.rateLimitDelay = 50;
        this.lastRequestTime = 0;

        this.initPromise = this.initData();
    }

    async initData() {
        try {
            const setsResult = await Promise.race([
                this.fetchSets(50),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout sets')), 5000))
            ]);

            if (!setsResult || setsResult.length === 0) {
                throw new Error('Aucun set disponible');
            }

            const cardsTestResult = await Promise.race([
                this.makeAPIRequest('cards', { pageSize: 3, page: 1 }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout cards')), 5000))
            ]);

            if (!cardsTestResult || !cardsTestResult.data || cardsTestResult.data.length === 0) {
                throw new Error('Impossible de récupérer des cartes');
            }

            const firstCard = cardsTestResult.data[0];
            if (!firstCard.name || !firstCard.id) {
                throw new Error('Structure de carte invalide');
            }

            this.availableSets = setsResult;
            this.apiAvailable = true;
            this.isInitializing = false;

        } catch (error) {
            this.apiAvailable = false;
            this.isInitializing = false;
        }
    }

    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
    }

    async makeAPIRequest(endpoint, params = {}) {
        await this.enforceRateLimit();

        const url = new URL(endpoint, this.baseURL);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.apiKey) {
            headers['X-Api-Key'] = this.apiKey;
        }

        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return data;
    }

    async ensureInitialized() {
        if (this.initPromise) {
            await this.initPromise;
        }
    }


    async getRandomCards(count = 10) {
        await this.ensureInitialized();

        if (!this.apiAvailable) {
            const fallbackCards = this.generateFallbackCards(count);
            return fallbackCards;
        }

        try {
            const apiCards = await this.fetchRandomCards(count);
            return apiCards;
        } catch (error) {
            console.error('❌ Erreur API, fallback vers cartes générées:', error.message);
            const fallbackCards = this.generateFallbackCards(count);
            return fallbackCards;
        }
    }

    async fetchRandomCards(count = 20) {

        let attempts = 0;
        const maxAttempts = 3;
        let bestResult = [];
        let bestDiversity = 0;

        while (attempts < maxAttempts) {
            attempts++;

            try {
                const ultraStrategies = [
                    () => this.fetchHyperDiverseMultiSets(count),
                    () => this.fetchCrossSetStrategy(count),
                    () => this.fetchFromMultipleSets(count),
                    () => this.fetchFromMultipleRecentSets(count)
                ];

                let selectedStrategy;
                const rand = Math.random();
                if (rand < 0.4) {
                    selectedStrategy = ultraStrategies[0];
                } else if (rand < 0.7) {
                    selectedStrategy = ultraStrategies[1];
                } else if (rand < 0.9) {
                    selectedStrategy = ultraStrategies[2];
                } else {
                    selectedStrategy = ultraStrategies[3];
                }

                const cards = await selectedStrategy();

                if (cards && cards.length > 0) {
                    const diversity = this.calculateDiversityScore(cards);

                    if (diversity.percentage > bestDiversity) {
                        bestResult = cards.slice(0, count);
                        bestDiversity = diversity.percentage;
                    }

                    if (diversity.percentage >= 80) {
                        return this.transformAPICards(cards.slice(0, count));
                    }

                    if (diversity.percentage >= 60 && attempts === maxAttempts) {
                        return this.transformAPICards(cards.slice(0, count));
                    }
                }

            } catch (error) {
                console.warn(`❌ Erreur tentative ${attempts}:`, error.message);
            }
        }

        if (bestResult.length > 0 && bestDiversity >= 40) {
            return this.transformAPICards(bestResult);
        }

        try {
            const fallbackCards = await this.fetchEmergencyDiverseStrategy(count);
            return this.transformAPICards(fallbackCards);
        } catch (error) {
            console.error('❌ Erreur fallback ultime:', error);
            const pageCards = await this.fetchRandomPageStrategy(count);
            return this.transformAPICards(pageCards);
        }
    }

    async fetchRandomPageStrategy(count) {
        const randomPage = Math.floor(Math.random() * 500) + 1;
        const orderOptions = [
            '-set.releaseDate',
            'name',
            '-hp',
            'number',
            'rarity',
            'set.name',
            'artist',
            '-number',
            'id',
            '-id',
            'supertype',
            '-rarity'
        ];
        const randomOrder = orderOptions[Math.floor(Math.random() * orderOptions.length)];

        const data = await this.makeAPIRequest('cards', {
            page: randomPage,
            pageSize: count,
            orderBy: randomOrder
        });

        return data.data || [];
    }

    async fetchMixedRarityStrategy(count) {
        const rarities = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Ultra Rare', 'Secret Rare'];
        const allCards = [];

        const cardsPerRarity = Math.ceil(count / 3);
        const selectedRarities = this.shuffleArray(rarities).slice(0, 3);

        for (const rarity of selectedRarities) {
            try {
                const cards = await this.fetchCardsByRarity(rarity, cardsPerRarity);
                const shuffledCards = this.shuffleArray(cards);
                allCards.push(...shuffledCards.slice(0, Math.ceil(count / 3)));
            } catch (error) {
                console.warn(`Impossible de récupérer des cartes ${rarity}:`, error.message);
            }
        }

        return this.shuffleArray(allCards).slice(0, count);
    }

    async fetchRandomFromRecentSets(count) {
        if (this.availableSets.length === 0) {
            await this.fetchSets();
        }

        const recentSets = this.availableSets
            .filter(set => set.legalities?.unlimited === 'Legal')
            .slice(0, 20);

        if (recentSets.length === 0) {
            return this.fetchRandomPageStrategy(count);
        }

        const selectedSets = this.shuffleArray(recentSets).slice(0, Math.max(2, Math.min(3, recentSets.length)));
        const allCards = [];

        for (const set of selectedSets) {
            try {
                const cards = await this.fetchCardsBySet(set.id, Math.ceil(count / selectedSets.length));
                allCards.push(...cards);
            } catch (error) {
                console.warn(`Impossible de récupérer des cartes du set ${set.name}:`, error.message);
            }
        }

        return this.shuffleArray(allCards).slice(0, count);
    }

    async fetchRandomByType(count) {
        const types = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'];
        const selectedTypes = this.shuffleArray(types).slice(0, Math.max(2, Math.min(4, types.length)));
        const allCards = [];


        for (const type of selectedTypes) {
            try {
                const randomPage = Math.floor(Math.random() * 100) + 1;
                const data = await this.makeAPIRequest('cards', {
                    q: `types:"${type}"`,
                    page: randomPage,
                    pageSize: Math.ceil(count / selectedTypes.length),
                    orderBy: Math.random() > 0.5 ? '-set.releaseDate' : 'name'
                });

                allCards.push(...(data.data || []));
            } catch (error) {
                console.warn(`Impossible de récupérer des cartes de type ${type}:`, error.message);
            }
        }

        return this.shuffleArray(allCards).slice(0, count);
    }

    async fetchByRandomHP(count) {
        const hpRanges = [
            'hp:[30 TO 80]',
            'hp:[80 TO 120]',
            'hp:[120 TO 200]',
            'hp:[200 TO *]'
        ];

        const randomRange = hpRanges[Math.floor(Math.random() * hpRanges.length)];
        const randomPage = Math.floor(Math.random() * 50) + 1;

        try {
            const data = await this.makeAPIRequest('cards', {
                q: randomRange,
                page: randomPage,
                pageSize: count,
                orderBy: Math.random() > 0.5 ? '-hp' : 'name'
            });

            return data.data || [];
        } catch (error) {
            console.warn(`Impossible de récupérer des cartes par HP:`, error.message);
            return [];
        }
    }

    async fetchByRandomSupertype(count) {
        const supertypes = ['Pokémon', 'Trainer', 'Energy'];
        const selectedSupertype = supertypes[Math.floor(Math.random() * supertypes.length)];
        const randomPage = Math.floor(Math.random() * 30) + 1;


        try {
            const data = await this.makeAPIRequest('cards', {
                q: `supertype:"${selectedSupertype}"`,
                page: randomPage,
                pageSize: count,
                orderBy: Math.random() > 0.5 ? '-set.releaseDate' : 'name'
            });

            return data.data || [];
        } catch (error) {
            console.warn(`Impossible de récupérer des cartes par supertype:`, error.message);
            return [];
        }
    }

    async fetchFromMultipleRecentSets(count) {
        if (this.availableSets.length === 0) {
            await this.fetchSets();
        }

        const recentSets = this.availableSets
            .filter(set => {
                const year = new Date(set.releaseDate).getFullYear();
                return year >= 2023 && set.legalities?.unlimited === 'Legal';
            })
            .slice(0, 15);

        if (recentSets.length === 0) {
            return this.fetchRandomPageStrategy(count);
        }

        const numSets = Math.min(5, Math.max(3, Math.floor(count / 3)));
        const selectedSets = this.shuffleArray(recentSets).slice(0, numSets);
        const allCards = [];

        for (const set of selectedSets) {
            try {
                const randomPage = Math.floor(Math.random() * 3) + 1;
                const cardsFromSet = Math.ceil(count / selectedSets.length);

                const data = await this.makeAPIRequest('cards', {
                    q: `set.id:${set.id}`,
                    page: randomPage,
                    pageSize: cardsFromSet,
                    orderBy: Math.random() > 0.5 ? 'number' : '-number'
                });

                allCards.push(...(data.data || []));
            } catch (error) {
                console.warn(`Impossible de récupérer des cartes du set ${set.name}:`, error.message);
            }
        }

        return this.shuffleArray(allCards).slice(0, count);
    }

    async fetchFromMultipleSets(count) {
        if (this.availableSets.length === 0) {
            await this.fetchSets();
        }

        const setsByEra = {
            recent: this.availableSets.filter(set => {
                const year = new Date(set.releaseDate).getFullYear();
                return year >= 2022;
            }),
            modern: this.availableSets.filter(set => {
                const year = new Date(set.releaseDate).getFullYear();
                return year >= 2018 && year < 2022;
            }),
            classic: this.availableSets.filter(set => {
                const year = new Date(set.releaseDate).getFullYear();
                return year >= 2010 && year < 2018;
            }),
            vintage: this.availableSets.filter(set => {
                const year = new Date(set.releaseDate).getFullYear();
                return year < 2010;
            })
        };

        const allCards = [];
        const targetSetsCount = Math.min(10, count + 2);
        const selectedSets = [];

        if (setsByEra.recent.length > 0) {
            selectedSets.push(setsByEra.recent[Math.floor(Math.random() * setsByEra.recent.length)]);
        }

        if (setsByEra.modern.length > 0) {
            const shuffled = this.shuffleArray(setsByEra.modern);
            selectedSets.push(...shuffled.slice(0, Math.min(2, targetSetsCount - selectedSets.length)));
        }

        if (setsByEra.classic.length > 0) {
            const shuffled = this.shuffleArray(setsByEra.classic);
            selectedSets.push(...shuffled.slice(0, Math.min(2, targetSetsCount - selectedSets.length)));
        }

        if (setsByEra.vintage.length > 0 && selectedSets.length < targetSetsCount) {
            const shuffled = this.shuffleArray(setsByEra.vintage);
            selectedSets.push(...shuffled.slice(0, targetSetsCount - selectedSets.length));
        }

        if (selectedSets.length === 0) {
            console.warn('⚠️ Aucun set trouvé par ère, utilisation de sets aléatoires');
            const shuffled = this.shuffleArray(this.availableSets);
            selectedSets.push(...shuffled.slice(0, Math.min(targetSetsCount, shuffled.length)));
        }

        if (selectedSets.length === 0) {
            console.error('❌ Aucun set sélectionné, fallback vers stratégie page aléatoire');
            return this.fetchRandomPageStrategy(count);
        }
        for (let i = 0; i < selectedSets.length; i++) {
            const set = selectedSets[i];
            try {
                const cardsPerSet = Math.min(2, Math.max(1, Math.ceil(count / selectedSets.length)));
                const randomPage = Math.floor(Math.random() * 3) + 1;


                const data = await this.makeAPIRequest('cards', {
                    q: `set.id:${set.id}`,
                    page: randomPage,
                    pageSize: cardsPerSet,
                    orderBy: Math.random() > 0.5 ? 'number' : '-number'
                });

                if (data.data && data.data.length > 0) {
                    const limitedCards = data.data.slice(0, cardsPerSet);
                    allCards.push(...limitedCards);
                } else {
                    console.warn(`⚠️ Set ${set.name}: Aucune carte trouvée`);
                }
            } catch (error) {
                console.warn(`❌ Impossible de récupérer des cartes du set ${set.name}:`, error.message);
            }
        }

        if (allCards.length === 0) {
            console.warn('⚠️ Aucune carte récupérée, fallback vers stratégie page aléatoire');
            return this.fetchRandomPageStrategy(count);
        }

        return this.shuffleArray(allCards).slice(0, count);
    }

    async fetchCrossSetStrategy(count) {
        if (this.availableSets.length === 0) {
            await this.fetchSets();
        }

        const allCards = [];
        const usedSetIds = new Set();
        const maxSets = Math.min(10, count * 1.2);

        const setSelectionStrategies = [
            () => {
                const yearGroups = {};
                this.availableSets.forEach(set => {
                    const year = new Date(set.releaseDate).getFullYear();
                    if (!yearGroups[year]) yearGroups[year] = [];
                    yearGroups[year].push(set);
                });

                const years = Object.keys(yearGroups).sort((a, b) => b - a);
                return years.slice(0, maxSets).map(year => {
                    const setsInYear = yearGroups[year];
                    return setsInYear[Math.floor(Math.random() * setsInYear.length)];
                });
            },

            () => {
                const setsBySizeCategory = {
                    large: this.availableSets.filter(set => set.total > 200),
                    medium: this.availableSets.filter(set => set.total >= 100 && set.total <= 200),
                    small: this.availableSets.filter(set => set.total < 100)
                };

                const selected = [];
                Object.values(setsBySizeCategory).forEach(category => {
                    if (category.length > 0) {
                        const shuffled = this.shuffleArray(category);
                        selected.push(...shuffled.slice(0, Math.ceil(maxSets / 3)));
                    }
                });

                return this.shuffleArray(selected).slice(0, maxSets);
            }
        ];

        const strategy = setSelectionStrategies[Math.floor(Math.random() * setSelectionStrategies.length)];
        const selectedSets = strategy().slice(0, maxSets);


        for (const set of selectedSets) {
            if (usedSetIds.has(set.id)) continue;
            usedSetIds.add(set.id);

            try {
                const cardsFromThisSet = 1;
                const randomPage = Math.floor(Math.random() * 5) + 1;


                const data = await this.makeAPIRequest('cards', {
                    q: `set.id:${set.id}`,
                    page: randomPage,
                    pageSize: cardsFromThisSet,
                    orderBy: Math.random() > 0.5 ? 'number' : 'name'
                });

                if (data.data && data.data.length > 0) {
                    allCards.push(...data.data);
                }
            } catch (error) {
                console.warn(`  ❌ Erreur set ${set.name}:`, error.message);
            }
        }

        const finalCards = this.shuffleArray(allCards).slice(0, count);

        return finalCards;
    }

    async fetchByCrossFilterStrategy(count) {
        const crossFilters = [
            async () => {
                const types = ['Fire', 'Water', 'Grass', 'Lightning', 'Psychic'];
                const type = types[Math.floor(Math.random() * types.length)];
                const hpRange = ['[30 TO 100]', '[100 TO 150]', '[150 TO 300]'][Math.floor(Math.random() * 3)];

                return this.makeAPIRequest('cards', {
                    q: `types:"${type}" AND hp:${hpRange}`,
                    page: Math.floor(Math.random() * 8) + 1,
                    pageSize: count,
                    orderBy: 'name'
                });
            },

            async () => {
                const rarities = ['Common', 'Uncommon', 'Rare', 'Ultra Rare'];
                const rarity = rarities[Math.floor(Math.random() * rarities.length)];

                return this.makeAPIRequest('cards', {
                    q: `rarity:"${rarity}" AND set.releaseDate:[2022-01-01 TO *]`,
                    page: Math.floor(Math.random() * 5) + 1,
                    pageSize: count,
                    orderBy: '-set.releaseDate'
                });
            },

            async () => {
                const supertypes = ['Pokémon', 'Trainer'];
                const supertype = supertypes[Math.floor(Math.random() * supertypes.length)];

                return this.makeAPIRequest('cards', {
                    q: `supertype:"${supertype}"`,
                    page: Math.floor(Math.random() * 10) + 1,
                    pageSize: count,
                    orderBy: 'artist'
                });
            }
        ];
        const randomFilter = crossFilters[Math.floor(Math.random() * crossFilters.length)];
        try {
            const result = await randomFilter();
            return result.data || [];
        } catch (error) {
            console.warn('Erreur dans le cross-filter, retour à la stratégie standard:', error.message);
            return this.fetchRandomPageStrategy(count);
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    async fetchSets(pageSize = 100) {
        try {
            const cacheKey = 'sets';
            if (this.cache.has(cacheKey)) {
                this.availableSets = this.cache.get(cacheKey);
                return this.availableSets;
            }

            const data = await this.makeAPIRequest('sets', { pageSize });
            this.availableSets = data.data || [];

            this.cache.set(cacheKey, this.availableSets);
            setTimeout(() => this.cache.delete(cacheKey), 3600000);

            return this.availableSets;
        } catch (error) {
            console.error('Erreur lors du chargement des sets:', error);
            return [];
        }
    }

    async fetchCardsBySet(setId, pageSize = 20) {
        try {
            const cacheKey = `cards_set_${setId}_${pageSize}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const data = await this.makeAPIRequest('cards', {
                q: `set.id:${setId}`,
                pageSize: pageSize,
                orderBy: 'number'
            });

            const cards = data.data || [];

            this.cache.set(cacheKey, cards);
            setTimeout(() => this.cache.delete(cacheKey), 1800000);

            return cards;
        } catch (error) {
            console.error(`Erreur lors du chargement des cartes du set ${setId}:`, error);
            return [];
        }
    }

    async searchCardsByName(name, pageSize = 10) {
        try {
            const data = await this.makeAPIRequest('cards', {
                q: `name:"${name}"`,
                pageSize: pageSize
            });

            return data.data || [];
        } catch (error) {
            console.error(`Erreur lors de la recherche de cartes avec le nom ${name}:`, error);
            return [];
        }
    }

    async fetchCardsByRarity(rarity, pageSize = 20) {
        try {
            const cacheKey = `cards_rarity_${rarity}_${pageSize}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const data = await this.makeAPIRequest('cards', {
                q: `rarity:"${rarity}"`,
                pageSize: pageSize,
                orderBy: '-set.releaseDate'
            });

            const cards = data.data || [];

            this.cache.set(cacheKey, cards);
            setTimeout(() => this.cache.delete(cacheKey), 3600000);

            return cards;
        } catch (error) {
            console.error(`Erreur lors du chargement des cartes de rareté ${rarity}:`, error);
            return [];
        }
    }

    async fetchCardsByType(type, pageSize = 20) {
        try {
            const data = await this.makeAPIRequest('cards', {
                q: `types:"${type}"`,
                pageSize: pageSize,
                orderBy: '-set.releaseDate'
            });

            return data.data || [];
        } catch (error) {
            console.error(`Erreur lors du chargement des cartes de type ${type}:`, error);
            return [];
        }
    }

    getBoosterRarityDistribution(count) {
        const distribution = {
            'Common': Math.floor(count * 0.6),
            'Uncommon': Math.floor(count * 0.3),
            'Rare': Math.floor(count * 0.08),
            'Rare Holo': Math.floor(count * 0.02)
        };

        const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
        if (total < count) {
            distribution['Common'] += count - total;
        }

        return distribution;
    }

    selectRandomCards(cards, count) {
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    convertAPICard(apiCard, index) {
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 10000);



        const convertedCard = {
            id: `${apiCard.id}-${timestamp}-${index}-${randomSuffix}`,
            name: apiCard.name || 'Carte Inconnue',
            hp: apiCard.hp ? parseInt(apiCard.hp) : Math.floor(Math.random() * 200) + 50,

            types: apiCard.types || ['Colorless'],

            attacks: this.convertAttacks(apiCard.attacks),

            weaknesses: apiCard.weaknesses ? apiCard.weaknesses.map(w => ({
                type: w.type,
                value: w.value
            })) : [],

            resistances: apiCard.resistances ? apiCard.resistances.map(r => ({
                type: r.type,
                value: r.value
            })) : [],
            rarity: apiCard.rarity || 'Common',

            set: {
                name: apiCard.set?.name || 'Set Inconnu',
                id: apiCard.set?.id || 'unknown',
                series: apiCard.set?.series || 'Série Inconnue',
                releaseDate: apiCard.set?.releaseDate || 'Date Inconnue'
            },

            images: {
                large: apiCard.images?.large || this.getFallbackPokemonImage(apiCard.name),
                small: apiCard.images?.small || this.getFallbackPokemonImage(apiCard.name)
            },
            image: apiCard.images?.large || apiCard.images?.small || this.getFallbackPokemonImage(apiCard.name),
            imageSmall: apiCard.images?.small || this.getFallbackPokemonImage(apiCard.name),

            artist: apiCard.artist || 'Artiste Inconnu',
            flavorText: apiCard.flavorText || `${apiCard.name} est un Pokémon mystérieux.`,
            description: apiCard.flavorText || `${apiCard.name} est un Pokémon de type ${apiCard.types?.[0] || 'Inconnu'}.`,

            retreat: apiCard.convertedRetreatCost || apiCard.retreatCost?.length || 0,
            retreatCost: apiCard.retreatCost || [],

            level: apiCard.level || Math.floor(Math.random() * 100) + 1,
            number: apiCard.number || '?',

            legalities: apiCard.legalities || { unlimited: 'Legal' },

            supertype: apiCard.supertype || 'Pokémon',
            subtypes: apiCard.subtypes || [],

            evolvesFrom: apiCard.evolvesFrom || null,
            evolvesTo: apiCard.evolvesTo || [],


            nationalPokedexNumbers: apiCard.nationalPokedexNumbers || [],

            tcgplayer: apiCard.tcgplayer || null,
            cardmarket: apiCard.cardmarket || null
        };


        return convertedCard;
    }

    convertAttacks(apiAttacks) {
        if (!apiAttacks || apiAttacks.length === 0) {
            const defaultAttacks = [
                {
                    name: 'Charge',
                    damage: '20',
                    cost: ['Colorless'],
                    convertedEnergyCost: 1,
                    text: 'Une attaque basique qui inflige des dégâts modérés.'
                },
                {
                    name: 'Vive-Attaque',
                    damage: '30',
                    cost: ['Colorless', 'Colorless'],
                    convertedEnergyCost: 2,
                    text: 'Une attaque rapide et efficace.'
                }
            ];
            return defaultAttacks;
        }

        return apiAttacks.map(attack => ({
            name: attack.name || 'Attaque',
            damage: attack.damage || '20',
            cost: attack.cost || ['Colorless'],
            convertedEnergyCost: attack.convertedEnergyCost || 1,
            text: attack.text || 'Description de l\'attaque non disponible.'
        }));
    }

    getPlaceholderImage(cardName) {
        const seed = cardName ? cardName.toLowerCase().replace(/\s+/g, '') : 'unknown';
        return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=random&size=245`;
    }

    generateFallbackCards(count) {
        const pokemonNames = [
            'Pikachu', 'Charizard', 'Blastoise', 'Venusaur', 'Mewtwo', 'Mew',
            'Articuno', 'Zapdos', 'Moltres', 'Dragonite', 'Alakazam', 'Gengar',
            'Machamp', 'Golem', 'Lapras', 'Eevee', 'Vaporeon', 'Jolteon',
            'Flareon', 'Snorlax', 'Gyarados', 'Scyther', 'Electabuzz', 'Magmar'
        ];

        const types = [
            'Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting',
            'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'
        ];

        const rarities = [
            'Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Secret Rare'
        ];

        const cards = [];
        for (let i = 0; i < count; i++) {
            const name = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            const rarity = rarities[Math.floor(Math.random() * rarities.length)];
            const hp = Math.floor(Math.random() * 200) + 50;

            cards.push({
                id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
                name,
                types: [type],
                hp,
                attacks: [
                    {
                        name: 'Charge',
                        damage: Math.floor(Math.random() * 50) + 20,
                        cost: [type],
                        text: `${name} utilise une attaque de base.`
                    }
                ],
                weaknesses: [],
                resistances: [],
                rarity,
                set: { name: 'Collection Fallback', id: 'fallback' },
                images: {
                    large: this.getFallbackPokemonImage(name),
                    small: this.getFallbackPokemonImage(name)
                },
                image: this.getFallbackPokemonImage(name),
                artist: 'Artiste Fallback',
                description: `${name} est un Pokémon de type ${type}.`,
                retreat: Math.floor(Math.random() * 3),
                level: Math.floor(Math.random() * 100) + 1
            });
        }

        return cards;
    }

    getFallbackPokemonImage(pokemonName) {
        const pokemonImageMap = {
            'Pikachu': 'base1/58_hires.png',
            'Charizard': 'base1/4_hires.png',
            'Blastoise': 'base1/2_hires.png',
            'Venusaur': 'base1/15_hires.png',
            'Squirtle': 'base1/63_hires.png',
            'Bulbasaur': 'base1/44_hires.png',
            'Charmander': 'base1/46_hires.png',
            'Wartortle': 'base1/42_hires.png',
            'Ivysaur': 'base1/30_hires.png',
            'Charmeleon': 'base1/24_hires.png',
            'Alakazam': 'base1/1_hires.png',
            'Machamp': 'base1/8_hires.png',
            'Geodude': 'base1/47_hires.png',
            'Gastly': 'base1/50_hires.png',
            'Onix': 'base1/56_hires.png',
            'Psyduck': 'base1/62_hires.png',
            'Magikarp': 'base1/35_hires.png',
            'Gyarados': 'base1/6_hires.png',
            'Mewtwo': 'base1/10_hires.png',
            'Mew': 'wizpromos/8_hires.png'
        };

        const imageId = pokemonImageMap[pokemonName] || 'base1/58_hires.png';

        return `https://images.pokemontcg.io/${imageId}`;
    }

    async fetchSeries() {
        return [
            { id: 'base', name: 'Base Series' },
            { id: 'neo', name: 'Neo Series' },
            { id: 'sword-shield', name: 'Sword & Shield' }
        ];
    }

    async fetchSet(setId) {
        try {
            const response = await this.makeAPIRequest(`sets/${setId}`);
            const setData = response.data;

            const cards = await this.fetchCardsBySet(setId, 50);
            return {
                ...setData,
                cards: cards
            };
        } catch (error) {
            console.error('Erreur lors du chargement du set:', error);
            return { cards: [] };
        }
    }

    async fetchCard(cardId) {
        try {
            const response = await this.makeAPIRequest(`cards/${cardId}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors du chargement de la carte:', error);
            return null;
        }
    }

    getAPIStatus() {
        return {
            available: this.apiAvailable,
            setsLoaded: this.availableSets.length,
            seriesLoaded: this.availableSeries.length,
            mode: this.apiAvailable ? 'Pokemon TCG API' : 'Fallback Cards',
            cacheSize: this.cache.size
        };
    }

    async testAPI() {
        try {
            const testCards = await Promise.race([
                this.fetchRandomCards(1),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout API')), 3000))
            ]);

            if (testCards && testCards.length > 0) {
                this.apiAvailable = true;
                return true;
            } else {
                this.apiAvailable = false;
                return false;
            }
        } catch (error) {
            this.apiAvailable = false;
            return false;
        }
    }

    async fetchHyperDiverseMultiSets(count) {

        if (this.availableSets.length === 0) {
            await this.fetchSets();
        }

        const targetDiverseCards = Math.min(count, 15);
        const allCards = [];
        const usedSetIds = new Set();

        const setSelectionPoolsByEra = {
            recent: this.availableSets.filter(set => {
                const year = new Date(set.releaseDate).getFullYear();
                return year >= 2020 && !usedSetIds.has(set.id);
            }),
            modern: this.availableSets.filter(set => {
                const year = new Date(set.releaseDate).getFullYear();
                return year >= 2015 && year < 2020 && !usedSetIds.has(set.id);
            }),
            classic: this.availableSets.filter(set => {
                const year = new Date(set.releaseDate).getFullYear();
                return year >= 2005 && year < 2015 && !usedSetIds.has(set.id);
            }),
            vintage: this.availableSets.filter(set => {
                const year = new Date(set.releaseDate).getFullYear();
                return year < 2005 && !usedSetIds.has(set.id);
            })
        };

        const setsPerEra = Math.ceil(targetDiverseCards / 4);
        const selectedSets = [];

        Object.values(setSelectionPoolsByEra).forEach(eraPool => {
            if (eraPool.length > 0) {
                const shuffled = this.shuffleArray(eraPool);
                selectedSets.push(...shuffled.slice(0, Math.min(setsPerEra, eraPool.length)));
            }
        });

        for (let i = 0; i < Math.min(selectedSets.length, targetDiverseCards); i++) {
            const set = selectedSets[i];
            if (usedSetIds.has(set.id)) continue;
            usedSetIds.add(set.id);

            try {
                const data = await this.makeAPIRequest('cards', {
                    q: `set.id:${set.id}`,
                    page: Math.floor(Math.random() * 5) + 1,
                    pageSize: 1,
                    orderBy: Math.random() > 0.5 ? 'number' : 'name'
                });

                if (data.data && data.data.length > 0) {
                    allCards.push(...data.data);
                }
            } catch (error) {
                console.warn(`❌ Erreur set ${set.name}:`, error.message);
            }
        }

        if (allCards.length < count) {
            const remaining = count - allCards.length;

            try {
                const additionalCards = await this.fetchRandomPageStrategy(remaining);
                allCards.push(...additionalCards);
            } catch (error) {
                console.warn('❌ Erreur complétion:', error.message);
            }
        }

        const result = this.shuffleArray(allCards).slice(0, count);
        return result;
    }

    async fetchEmergencyDiverseStrategy(count) {

        const emergencyStrategies = [
            async () => {
                const results = [];
                for (let i = 0; i < Math.min(count, 5); i++) {
                    const randomPage = Math.floor(Math.random() * 1000) + 1;
                    try {
                        const data = await this.makeAPIRequest('cards', {
                            page: randomPage,
                            pageSize: Math.ceil(count / 5),
                            orderBy: '-set.releaseDate'
                        });
                        results.push(...(data.data || []));
                    } catch (error) {
                        console.warn(`❌ Page ${randomPage}:`, error.message);
                    }
                }
                return results;
            },


            async () => {
                const types = ['Fire', 'Water', 'Grass', 'Electric', 'Psychic'];
                const results = [];
                for (const type of types.slice(0, Math.min(types.length, 3))) {
                    try {
                        const data = await this.makeAPIRequest('cards', {
                            q: `types:"${type}"`,
                            page: Math.floor(Math.random() * 20) + 1,
                            pageSize: Math.ceil(count / 3)
                        });
                        results.push(...(data.data || []));
                    } catch (error) {
                        console.warn(`❌ Type ${type}:`, error.message);
                    }
                }
                return results;
            }
        ];

        for (const strategy of emergencyStrategies) {
            try {
                const cards = await strategy();
                if (cards && cards.length > 0) {
                    return this.shuffleArray(cards).slice(0, count);
                }
            } catch (error) {
                console.warn('❌ Stratégie d\'urgence échouée:', error.message);
            }
        }

        return await this.fetchRandomPageStrategy(count);
    }

    calculateDiversityScore(cards) {
        if (!cards || cards.length === 0) {
            return { percentage: 0, uniqueSets: 0, details: {} };
        }

        const setNames = cards.map(card => card.set?.name || card.set?.id || 'Unknown');
        const uniqueSets = new Set(setNames);
        const uniqueSetCount = uniqueSets.size;

        const diversityPercentage = Math.round((uniqueSetCount / cards.length) * 100);

        const setDistribution = {};
        setNames.forEach(setName => {
            setDistribution[setName] = (setDistribution[setName] || 0) + 1;
        });

        return {
            percentage: diversityPercentage,
            uniqueSets: uniqueSetCount,
            totalCards: cards.length,
            setDistribution,
            details: {
                maxCardsPerSet: Math.max(...Object.values(setDistribution)),
                minCardsPerSet: Math.min(...Object.values(setDistribution)),
                averageCardsPerSet: Math.round(cards.length / uniqueSetCount)
            }
        };
    }

    transformAPICards(apiCards) {
        if (!apiCards || !Array.isArray(apiCards)) {
            return [];
        }

        return apiCards.map((apiCard, index) => this.convertAPICard(apiCard, index)).filter(card => card !== null);
    }

    transformAPICard(apiCard) {
        if (!apiCard) {
            return null;
        }

        return this.convertAPICard(apiCard, 0);
    }
}
