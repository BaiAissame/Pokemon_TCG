// models/CardModel.js
class CardModel {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.image = (data.image && !data.image.endsWith('.webp')) ? data.image + '/high.webp' : data.image || '';
    this.types = data.types || [];
    this.hp = parseInt(data.hp) || 100;
    this.attacks = data.attacks || [];
    this.weaknesses = data.weaknesses || [];
    this.resistances = data.resistances || [];
    this.rarity = data.rarity;
    this.set = data.set;
    this.artist = data.artist;
    this.retreatCost = data.retreatCost || [];
  }

  getTypeClass() {
    if (this.types && this.types.length > 0) {
      return this.types[0].name.toLowerCase();
    }
    return "colorless";
  }

  isRare() {
    return (
      this.rarity &&
      (this.rarity.name === "Rare" ||
        this.rarity.name === "Ultra Rare" ||
        this.rarity.name === "Secret Rare")
    );
  }

  getDisplayName() {
    return this.name || "Carte Inconnue";
  }

  getHP() {
    return this.hp || "?";
  }

  getAttackPower() {
    if (this.attacks && this.attacks.length > 0) {
      const damages = this.attacks
        .map((attack) => {
          if (typeof attack.damage === 'number') return attack.damage;
          if (typeof attack.damage === 'string') {
            // Certains formats sont "30+", "20x", "10", ""
            const match = attack.damage.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
          }
          return 0;
        })
        .filter((damage) => !isNaN(damage) && damage > 0);
      if (damages.length > 0) return Math.max(...damages);
      return 0;
    }
    return 0;
  }
}

export default CardModel