// models/TrainerModel.js
class TrainerModel {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.rating = data.rating || 0;
    this.battles = data.battles || 0;
    this.online = data.online || false;
    this.avatar =
      data.avatar ||
      `https://api.dicebear.com/7.x/personas/svg?seed=${this.name}`;
    this.comments = data.comments || [];
  }

  addComment(comment, rating) {
    this.comments.push({
      comment,
      rating,
      date: new Date().toISOString(),
    });
    this.updateRating();
  }

  updateRating() {
    if (this.comments.length > 0) {
      const sum = this.comments.reduce(
        (acc, comment) => acc + comment.rating,
        0
      );
      this.rating = (sum / this.comments.length).toFixed(1);
    }
  }
}

export default TrainerModel;
