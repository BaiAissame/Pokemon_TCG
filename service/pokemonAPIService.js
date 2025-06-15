export default class PokemonAPIService {
    constructor(tcgdx) {
        // Initialisation du SDK TCGdx
        this.tcgdx = tcgdx;
        this.cache = new Map();
        this.availableSets = [];
        const attackNames = [
            'Charge', 'Éclair', 'Flamme', 'Hydrocanon', 'Vibraqua', 'Tranch\'Herbe', 'Psyko', 'Poing-Karaté',
            'Griffe', 'Morsure', 'Onde Folie', 'Laser Glace', 'Draco-Rage', 'Croc Fatal', 'Boule Elek',
            'Jet de Sable', 'Combo-Griffe', 'Coud\'Boue', 'Vive-Attaque', 'Tornade', 'Bélier', 'Coud\'Krâne',
            'Coud\'Jarnac', 'Coup Bas', 'Coup d\'Main', 'Fracas', 'Uppercut', 'Rafale', 'Tempête', 'Blizzard',
            'Tonnerre', 'Séisme', 'Explosion', 'Météore', 'Nova', 'Tsunami', 'Cyclone', 'Avalanche'
        ];this.availableSeries = [];
        this.initData();
    }

    async initData() {
        try {
            // Charger les sets et séries disponibles avec les vraies méthodes
            this.availableSets = await this.tcgdx.fetchSets();
            this.availableSeries = await this.tcgdx.fetchSeries();
        } catch (error) {
            console.warn('Erreur lors du chargement des données:', error);
            this.availableSets = [];
            this.availableSeries = [];
        }
    }    async getRandomCards(count = 5) {
        try {
            // Méthode 1: Récupérer des cartes d'un set aléatoire
            if (this.availableSets.length > 0) {
                const cards = await this.getCardsFromRandomSet(count);
                if (cards && cards.length > 0) {
                    return cards;
                }
            }

            // Méthode 2: Récupération directe de cartes avec fetchCards
            const cards = await this.getCardsDirectly(count);
            if (cards && cards.length > 0) {
                return cards;
            }

            // Méthode 3: Fallback si tout échoue
            return this.generateFallbackCards(count);

        } catch (error) {
            console.warn('Erreur API TCGdx, utilisation du fallback:', error);
            return this.generateFallbackCards(count);
        }
    }

    async getCardsFromRandomSet(count) {
        try {
            // Sélectionner un set aléatoire
            const randomSet = this.availableSets[Math.floor(Math.random() * Math.min(this.availableSets.length, 20))];

            // Récupérer les détails du set avec fetchSet
            const setWithCards = await this.tcgdx.fetchSet(randomSet.id);

            if (!setWithCards.cards || setWithCards.cards.length === 0) {
                throw new Error('Aucune carte dans ce set');
            }

            // Sélectionner des cartes aléatoires du set
            const selectedCards = [];
            const availableCards = [...setWithCards.cards]; // Copie pour éviter mutation

            for (let i = 0; i < Math.min(count, availableCards.length); i++) {
                const randomIndex = Math.floor(Math.random() * availableCards.length);
                const card = availableCards[randomIndex];

                // Améliorer les cartes de l'API qui n'ont pas d'attaques
                const improvedCard = this.improveApiCard(card, i);
                selectedCards.push(improvedCard);

                // Éviter les doublons
                availableCards.splice(randomIndex, 1);
            }

            return selectedCards;

        } catch (error) {
            console.warn('Erreur getCardsFromRandomSet:', error);
            throw error;
        }
    }

    async getCardsDirectly(count) {
        try {

            // Récupérer toutes les cartes (sans paramètre)
            const cards = await this.tcgdx.fetchCards();

            if (!cards || cards.length === 0) {
                throw new Error('Aucune carte trouvée');
            }

            // Sélectionner des cartes aléatoires
            const selectedCards = [];
            for (let i = 0; i < Math.min(count, cards.length); i++) {
                const randomIndex = Math.floor(Math.random() * cards.length);
                const card = cards[randomIndex];

                // Améliorer les cartes de l'API qui n'ont pas d'attaques
                const improvedCard = this.improveApiCard(card, i);
                selectedCards.push(improvedCard);
            }

            return selectedCards;

        } catch (error) {
            console.warn('Erreur getCardsDirectly:', error);
            throw error;
        }
    }

    async getCardById(cardId) {
        try {
            // Récupérer une carte spécifique avec fetchCard
            const card = await this.tcgdx.fetchCard(cardId);
            return card;
        } catch (error) {
            console.error('Erreur lors de la récupération de la carte:', error);
            return null;
        }
    }

    async getRandomCardFromSpecificSet(setId) {
        try {
            const setData = await this.tcgdx.fetchSet(setId);

            if (!setData.cards || setData.cards.length === 0) {
                return null;
            }

            const randomCard = setData.cards[Math.floor(Math.random() * setData.cards.length)];
            return {
                ...randomCard,
                id: `${randomCard.id}-${Date.now()}`
            };

        } catch (error) {
            console.error('Erreur getRandomCardFromSpecificSet:', error);
            return null;
        }
    }

    async getCardsFromSerie(serieId, count = 5) {
        try {
            const serieData = await this.tcgdx.fetchSerie(serieId);

            if (!serieData.sets || serieData.sets.length === 0) {
                throw new Error('Aucun set dans cette série');
            }

            // Prendre un set aléatoire de la série
            const randomSet = serieData.sets[Math.floor(Math.random() * serieData.sets.length)];
            const setData = await this.tcgdx.fetchSet(randomSet.id);

            if (!setData.cards || setData.cards.length === 0) {
                throw new Error('Aucune carte dans ce set');
            }

            // Sélectionner des cartes aléatoires
            const selectedCards = [];
            for (let i = 0; i < Math.min(count, setData.cards.length); i++) {
                const randomIndex = Math.floor(Math.random() * setData.cards.length);
                const card = setData.cards[randomIndex];

                selectedCards.push({
                    ...card,
                    id: `${card.id}-${Date.now()}-${i}`
                });
            }

            return selectedCards;

        } catch (error) {
            console.warn('Erreur getCardsFromSerie:', error);
            throw error;
        }
    }

    generateFallbackCards(count) {
        const pokemonNames = [
            'Pikachu', 'Charizard', 'Blastoise', 'Venusaur', 'Mewtwo', 'Mew',
            'Articuno', 'Zapdos', 'Moltres', 'Dragonite', 'Alakazam', 'Gengar',
            'Machamp', 'Golem', 'Lapras', 'Eevee', 'Vaporeon', 'Jolteon',
            'Flareon', 'Snorlax', 'Gyarados', 'Scyther', 'Electabuzz', 'Magmar',
            'Psyduck', 'Golduck', 'Machop', 'Machoke', 'Tentacool', 'Tentacruel',
            'Magikarp', 'Ditto', 'Porygon', 'Aerodactyl', 'Jinx', 'Onix'
        ];

        const types = [
            { name: 'Grass' }, { name: 'Fire' }, { name: 'Water' },
            { name: 'Lightning' }, { name: 'Psychic' }, { name: 'Fighting' },
            { name: 'Darkness' }, { name: 'Metal' }, { name: 'Fairy' },
            { name: 'Dragon' }, { name: 'Colorless' }
        ];

        const rarities = [
            { name: 'Common' }, { name: 'Uncommon' }, { name: 'Rare' },
            { name: 'Ultra Rare' }, { name: 'Secret Rare' }
        ];

        const sets = [
            { name: 'Base Set', id: 'base1' },
            { name: 'Jungle', id: 'jungle' },
            { name: 'Fossil', id: 'fossil' },
            { name: 'Team Rocket', id: 'teamrocket' },
            { name: 'Gym Heroes', id: 'gymheroes' },
            { name: 'Neo Genesis', id: 'neogenesis' }
        ];

        const attackNames = [
            'Charge', 'Éclair', 'Flamme', 'Hydrocanon', 'Vibraqua', 'Tranch’Herbe', 'Psyko', 'Poing-Karaté', 'Griffe', 'Morsure', 'Onde Folie', 'Laser Glace', 'Draco-Rage', 'Croc Fatal', 'Boule Elek', 'Jet de Sable', 'Combo-Griffe', 'Coud’Boue', 'Vive-Attaque', 'Tornade', 'Bélier', 'Coup d’Boule', 'Coud’Krâne', 'Coup Double', 'Coud’Jarnac', 'Coup Bas', 'Coup d’Main', 'Coup d’Boule', 'Coup d’Boule', 'Coup d’Boule', 'Coup d’Boule'
        ];

        const cards = [];
        for (let i = 0; i < count; i++) {
            const name = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            const rarity = rarities[Math.floor(Math.random() * rarities.length)];
            const set = sets[Math.floor(Math.random() * sets.length)];

            const hp = Math.floor(Math.random() * 200) + 50;
            // Générer exactement 4 attaques différentes, sans doublons
            const nbAttacks = 4;
            const shuffledAttackNames = [...attackNames].sort(() => Math.random() - 0.5); // Mélanger
            const attacks = [];

            for (let j = 0; j < nbAttacks && j < shuffledAttackNames.length; j++) {
                const attackName = shuffledAttackNames[j];
                const attackDmg = Math.floor(Math.random() * 80) + 10;
                // Ajoute un coût aléatoire (1 à 2 types)
                const cost = [type];
                if (Math.random() > 0.6) cost.push(types[Math.floor(Math.random() * types.length)]);
                attacks.push({
                    name: attackName,
                    damage: attackDmg,
                    cost,
                    text: `${name} utilise ${attackName} et inflige ${attackDmg} dégâts.`
                });
            }
            cards.push({
                id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
                name,
                types: [type],
                hp,
                attacks,
                weaknesses: Math.random() > 0.5 ? [{
                    type: types[Math.floor(Math.random() * types.length)],
                    value: '×2'
                }] : [],
                resistances: Math.random() > 0.7 ? [{
                    type: types[Math.floor(Math.random() * types.length)],
                    value: '-20'
                }] : [],
                rarity,
                set,
                image: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=random`,
                category: 'Pokemon',
                artist: 'Artiste Classique',
                description: `${name} est un Pokémon de type ${type.name} avec ${hp} points de vie.`,
                retreat: Math.floor(Math.random() * 3),
                level: Math.floor(Math.random() * 100) + 1
            });
        }

        return cards;
    }

    // Méthode pour améliorer les cartes de l'API qui manquent d'attaques
    improveApiCard(card, index) {
        const improvedCard = {
            ...card,
            id: `${card.id}-${Date.now()}-${index}`
        };

        // Si la carte n'a pas d'attaques, en générer
        if (!improvedCard.attacks || improvedCard.attacks.length === 0) {

            const attackNames = [
                'Charge', 'Éclair', 'Flamme', 'Hydrocanon', 'Vibraqua', 'Tranch\'Herbe', 'Psyko', 'Poing-Karaté',
                'Griffe', 'Morsure', 'Onde Folie', 'Laser Glace', 'Draco-Rage', 'Croc Fatal', 'Boule Elek',
                'Jet de Sable', 'Combo-Griffe', 'Coud\'Boue', 'Vive-Attaque', 'Tornade', 'Bélier', 'Coud\'Krâne',
                'Coud\'Jarnac', 'Coup Bas', 'Coup d\'Main', 'Fracas', 'Uppercut', 'Rafale', 'Tempête', 'Blizzard'
            ];

            const types = [
                { name: 'Grass' }, { name: 'Fire' }, { name: 'Water' },
                { name: 'Lightning' }, { name: 'Psychic' }, { name: 'Fighting' },
                { name: 'Darkness' }, { name: 'Metal' }, { name: 'Fairy' },
                { name: 'Dragon' }, { name: 'Colorless' }
            ];

            // Prendre le type de la carte ou un type aléatoire
            const cardType = (improvedCard.types && improvedCard.types.length > 0)
                ? improvedCard.types[0]
                : types[Math.floor(Math.random() * types.length)];

            // Générer 2-4 attaques uniques
            const nbAttacks = 2 + Math.floor(Math.random() * 3); // 2 à 4 attaques
            const shuffledAttackNames = [...attackNames].sort(() => Math.random() - 0.5);
            const attacks = [];

            for (let j = 0; j < nbAttacks && j < shuffledAttackNames.length; j++) {
                const attackName = shuffledAttackNames[j];
                const attackDmg = Math.floor(Math.random() * 80) + 10;
                const cost = [cardType];
                if (Math.random() > 0.6) cost.push(types[Math.floor(Math.random() * types.length)]);

                attacks.push({
                    name: attackName,
                    damage: attackDmg,
                    cost,
                    text: `${improvedCard.name} utilise ${attackName} et inflige ${attackDmg} dégâts.`
                });
            }

            improvedCard.attacks = attacks;
        }

        return improvedCard;
    }

    // Méthodes utilitaires avec les vraies méthodes du SDK
    async getSets() {
        try {
            return await this.tcgdx.fetchSets();
        } catch (error) {
            console.error('Erreur lors de la récupération des sets:', error);
            return [];
        }
    }

    async getSetById(setId) {
        try {
            return await this.tcgdx.fetchSet(setId);
        } catch (error) {
            console.error('Erreur lors de la récupération du set:', error);
            return null;
        }
    }

    async getSeries() {
        try {
            return await this.tcgdx.fetchSeries();
        } catch (error) {
            console.error('Erreur lors de la récupération des séries:', error);
            return [];
        }
    }

    async getSerieById(serieId) {
        try {
            return await this.tcgdx.fetchSerie(serieId);
        } catch (error) {
            console.error('Erreur lors de la récupération de la série:', error);
            return null;
        }
    }

    // Méthodes utilitaires avancées
    async getRandomSet() {
        try {
            if (this.availableSets.length === 0) {
                await this.initData();
            }
            const randomSet = this.availableSets[Math.floor(Math.random() * this.availableSets.length)];
            return await this.tcgdx.fetchSet(randomSet.id);
        } catch (error) {
            console.error('Erreur lors de la récupération d\'un set aléatoire:', error);
            return null;
        }
    }

    async getRandomSerie() {
        try {
            if (this.availableSeries.length === 0) {
                await this.initData();
            }
            const randomSerie = this.availableSeries[Math.floor(Math.random() * this.availableSeries.length)];
            return await this.tcgdx.fetchSerie(randomSerie.id);
        } catch (error) {
            console.error('Erreur lors de la récupération d\'une série aléatoire:', error);
            return null;
        }
    }

    // Méthode pour obtenir des statistiques
    getAPIStats() {
        return {
            lang: this.tcgdx.getLang(),
            setsLoaded: this.availableSets.length,
            seriesLoaded: this.availableSeries.length,
            cacheSize: this.cache.size,
            lastUpdate: new Date().toLocaleString('fr-FR')
        };
    }

    // Vider le cache si nécessaire
    clearCache() {
        this.cache.clear();
        console.log('Cache API vidé');
    }

    // Test de connectivité API
    async testAPI() {
        try {
            const testCards = await this.tcgdx.fetchCards(1);
            console.log('✅ API TCGdx opérationnelle:', testCards.length, 'cartes récupérées');
            return true;
        } catch (error) {
            console.error('❌ Erreur API TCGdx:', error);
            return false;
        }
    }
}