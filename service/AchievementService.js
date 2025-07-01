// service/AchievementService.js
class AchievementService {
    constructor(gameState) {
        this.gameState = gameState;
        this.achievements = [
            {
                id: 'first_card',
                name: 'Première Carte',
                description: 'Tirez votre première carte',
                icon: '🎴',
                condition: (state) => state.totalCards >= 1,
                points: 10
            },
            {
                id: 'collector',
                name: 'Collectionneur',
                description: 'Possédez 50 cartes',
                icon: '📚',
                condition: (state) => state.totalCards >= 50,
                points: 50
            },
            {
                id: 'rare_hunter',
                name: 'Chasseur de Rares',
                description: 'Obtenez 10 cartes rares',
                icon: '✨',
                condition: (state) => state.rareCards >= 10,
                points: 100
            },
            {
                id: 'first_win',
                name: 'Première Victoire',
                description: 'Remportez votre premier combat',
                icon: '🏆',
                condition: (state) => state.statistics?.totalWins >= 1,
                points: 25
            },
            {
                id: 'win_streak_5',
                name: 'En Série',
                description: 'Remportez 5 combats d\'affilée',
                icon: '🔥',
                condition: (state) => state.statistics?.currentWinStreak >= 5,
                points: 75
            },
            {
                id: 'rich_trainer',
                name: 'Dresseur Riche',
                description: 'Accumulez 500 crédits',
                icon: '💰',
                condition: (state) => state.credits >= 500,
                points: 60
            },
            {
                id: 'social_butterfly',
                name: 'Papillon Social',
                description: 'Interagissez avec 5 dresseurs différents',
                icon: '🦋',
                condition: (state) => state.battles >= 5,
                points: 40
            },
            {
                id: 'marathon_player',
                name: 'Marathonien',
                description: 'Ouvrez 20 boosters',
                icon: '🏃',
                condition: (state) => state.boosters >= 20,
                points: 120
            },
            {
                id: 'perfectionist',
                name: 'Perfectionniste',
                description: 'Gagnez un combat sans subir de dégâts',
                icon: '🛡️',
                condition: (state, battleState) => battleState?.perfectWin === true,
                points: 150
            }
        ];
    }

    checkAchievements(battleState = null) {
        const unlockedAchievements = [];

        this.achievements.forEach(achievement => {
            const isUnlocked = this.gameState.achievements?.some(a => a.id === achievement.id);
            if (!isUnlocked && achievement.condition(this.gameState, battleState)) {
                unlockedAchievements.push(achievement);
                this.showAchievementNotification(achievement);
            }
        });


        return unlockedAchievements;
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-details">
                    <div class="achievement-title">Succès débloqué!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-points">+${achievement.points} points</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 4000);
    }

    getTotalPoints() {
        if (!this.gameState.achievements) return 0;

        return this.gameState.achievements.reduce((total, userAchievement) => {
            const achievement = this.achievements.find(a => a.id === userAchievement.id);
            return total + (achievement ? achievement.points : 0);
        }, 0);
    }

    getProgress() {
        const total = this.achievements.length;
        const unlocked = this.gameState.achievements?.length || 0;
        return { unlocked, total, percentage: Math.round((unlocked / total) * 100) };
    }
}

export default AchievementService;
