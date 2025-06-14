// models/CardModel.js 
class CardModel {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.image = data.image+'/high.webp';
    this.types = data.types || [];
    this.hp = data.hp;
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
        .map((attack) => attack.damage)
        .filter((damage) => damage && !isNaN(parseInt(damage)))
        .map((damage) => parseInt(damage));

      return damages.length > 0 ? Math.max(...damages) : 0;
    }
    return 0;
  }
}

export default CardModel