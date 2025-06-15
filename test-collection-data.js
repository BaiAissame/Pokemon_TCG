// test-collection-data.js
// Script pour ajouter des cartes de test à la collection

// Générer quelques cartes de test
const testCards = [
    {
        id: 'test-pikachu-001',
        name: 'Pikachu',
        image: 'https://images.pokemontcg.io/base1/58_hires.png',
        types: [{ name: 'Lightning' }],
        hp: 60,
        attacks: [
            { name: 'Thunder Shock', damage: 10, cost: [{ name: 'Lightning' }], text: 'Flip a coin. If tails, Pikachu does 10 damage to itself.' },
            { name: 'Agility', damage: 20, cost: [{ name: 'Lightning' }, { name: 'Lightning' }], text: 'Flip a coin. If heads, during your opponent\'s next turn, prevent all effects of attacks, including damage, done to Pikachu.' }
        ],
        weaknesses: [{ type: { name: 'Fighting' }, value: '×2' }],
        resistances: [],
        rarity: { name: 'Common' },
        set: { name: 'Base Set' },
        artist: 'Mitsuhiro Arita'
    },
    {
        id: 'test-charizard-001',
        name: 'Charizard',
        image: 'https://images.pokemontcg.io/base1/4_hires.png',
        types: [{ name: 'Fire' }],
        hp: 120,
        attacks: [
            { name: 'Fire Blast', damage: 100, cost: [{ name: 'Fire' }, { name: 'Fire' }, { name: 'Fire' }, { name: 'Fire' }], text: 'Discard 1 Fire Energy card attached to Charizard in order to use this attack.' }
        ],
        weaknesses: [{ type: { name: 'Water' }, value: '×2' }],
        resistances: [{ type: { name: 'Fighting' }, value: '-30' }],
        rarity: { name: 'Ultra Rare' },
        set: { name: 'Base Set' },
        artist: 'Mitsuhiro Arita'
    },
    {
        id: 'test-blastoise-001',
        name: 'Blastoise',
        image: 'https://images.pokemontcg.io/base1/2_hires.png',
        types: [{ name: 'Water' }],
        hp: 100,
        attacks: [
            { name: 'Hydro Pump', damage: 40, cost: [{ name: 'Water' }, { name: 'Water' }, { name: 'Water' }], text: 'Does 40 damage plus 10 more damage for each Water Energy attached to Blastoise but not used to pay for this attack\'s Energy cost.' }
        ],
        weaknesses: [{ type: { name: 'Lightning' }, value: '×2' }],
        resistances: [],
        rarity: { name: 'Rare' },
        set: { name: 'Base Set' },
        artist: 'Ken Sugimori'
    },
    {
        id: 'test-venusaur-001',
        name: 'Venusaur',
        image: 'https://images.pokemontcg.io/base1/15_hires.png',
        types: [{ name: 'Grass' }],
        hp: 100,
        attacks: [
            { name: 'Petal Dance', damage: 40, cost: [{ name: 'Grass' }, { name: 'Grass' }, { name: 'Grass' }, { name: 'Grass' }], text: 'Flip 3 coins. This attack does 40 damage times the number of heads.' }
        ],
        weaknesses: [{ type: { name: 'Fire' }, value: '×2' }],
        resistances: [],
        rarity: { name: 'Rare' },
        set: { name: 'Base Set' },
        artist: 'Ken Sugimori'
    },
    {
        id: 'test-mewtwo-001',
        name: 'Mewtwo',
        image: 'https://images.pokemontcg.io/base1/10_hires.png',
        types: [{ name: 'Psychic' }],
        hp: 70,
        attacks: [
            { name: 'Psychic', damage: 10, cost: [{ name: 'Psychic' }, { name: 'Psychic' }], text: 'Does 10 damage plus 10 more damage for each Energy card attached to the Defending Pokémon.' }
        ],
        weaknesses: [{ type: { name: 'Psychic' }, value: '×2' }],
        resistances: [],
        rarity: { name: 'Secret Rare' },
        set: { name: 'Base Set' },
        artist: 'Ken Sugimori'
    }
];

// Fonction pour ajouter les cartes de test
function addTestCardsToCollection() {
    // Vérifier si on est dans le bon contexte (navigateur)
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            // Charger l'état actuel du jeu
            let gameState = JSON.parse(localStorage.getItem('pokemonTCG_gameState') || '{}');

            // Initialiser la collection si elle n'existe pas
            if (!gameState.collection) {
                gameState.collection = [];
            }

            // Initialiser les autres propriétés nécessaires
            gameState.deck = gameState.deck || [];
            gameState.hand = gameState.hand || [];
            gameState.totalCards = gameState.totalCards || 0;
            gameState.rareCards = gameState.rareCards || 0;

            // Ajouter les cartes de test à la collection
            testCards.forEach(cardData => {
                // Vérifier si la carte n'existe pas déjà
                const existingCard = gameState.collection.find(c => c.id === cardData.id);
                if (!existingCard) {
                    const collectionCard = {
                        ...cardData,
                        addedAt: new Date().toISOString(),
                        timesUsed: Math.floor(Math.random() * 5), // Utilisation aléatoire pour la démo
                        favorited: Math.random() > 0.7 // 30% de chance d'être favori
                    };
                    gameState.collection.push(collectionCard);

                    // Mettre à jour les statistiques
                    gameState.totalCards++;
                    if (cardData.rarity && (cardData.rarity.name === 'Rare' || cardData.rarity.name === 'Ultra Rare' || cardData.rarity.name === 'Secret Rare')) {
                        gameState.rareCards++;
                    }
                }
            });

            // Sauvegarder l'état mis à jour
            localStorage.setItem('pokemonTCG_gameState', JSON.stringify(gameState));

            console.log('✅ Cartes de test ajoutées à la collection!');
            console.log('📊 Collection contient maintenant:', gameState.collection.length, 'cartes');

            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout des cartes de test:', error);
            return false;
        }
    } else {
        console.log('⚠️ Ce script doit être exécuté dans un navigateur');
        return false;
    }
}

// Exporter pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testCards, addTestCardsToCollection };
} else if (typeof window !== 'undefined') {
    window.addTestCardsToCollection = addTestCardsToCollection;
    window.testCards = testCards;
}
