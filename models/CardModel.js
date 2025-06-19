// models/CardModel.js
class CardModel {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.image = data.images?.large || data.images?.small || data.image || '';
    this.types = data.types || [];
    this.hp = parseInt(data.hp) || 100;
    this.battleHP = parseInt(data.hp) || 0;
    this.attacks = data.attacks || [];
    this.weaknesses = data.weaknesses || [];
    this.resistances = data.resistances || [];
    this.rarity = data.rarity ? { name: data.rarity } : null;
    this.set = data.set;
    this.artist = data.artist;
    this.retreatCost = data.retreatCost || [];
    this.supertype = data.supertype;
    this.subtypes = data.subtypes || [];
  }

  getTypeClass() {
    if (this.types && this.types.length > 0) {
      const firstType = this.types[0];
      if (typeof firstType === 'string') {
        return firstType.toLowerCase();
      } else if (firstType && firstType.name) {
        return firstType.name.toLowerCase();
      }
    }
    return "colorless";
  }

  isRare() {
    return (
      this.rarity &&
      (this.rarity === "Rare" ||
        this.rarity === "Ultra Rare" ||
        this.rarity === "Secret Rare" ||
        this.rarity === "Rare Holo" ||
        this.rarity === "Rare Holo EX" ||
        this.rarity === "Rare Holo GX" ||
        this.rarity === "Rare Holo V" ||
        this.rarity === "Rare Holo VMAX" ||
        this.rarity === "Double Rare" ||
        this.rarity === "Rare Ultra" ||
        this.rarity === "Rare Secret" ||
        (this.rarity.name && (
          this.rarity.name === "Rare" ||
          this.rarity.name === "Ultra Rare" ||
          this.rarity.name === "Secret Rare" ||
          this.rarity.name === "Rare Holo" ||
          this.rarity.name === "Rare Holo EX" ||
          this.rarity.name === "Rare Holo GX" ||
          this.rarity.name === "Rare Holo V" ||
          this.rarity.name === "Rare Holo VMAX" ||
          this.rarity.name === "Double Rare" ||
          this.rarity.name === "Rare Ultra" ||
          this.rarity.name === "Rare Secret"
        )))
    );
  }

  getDisplayName() {
    return this.name || "Carte Inconnue";
  }

  getHP() {
    return this.hp || "?";
  }

  getBattleHP() {
    return this.battleHP || 0;
  }

  getAttackPower() {
    if (this.attacks && this.attacks.length > 0) {
      const damages = this.attacks
        .map((attack) => {
          if (typeof attack.damage === 'number') return attack.damage;
          if (typeof attack.damage === 'string') {
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