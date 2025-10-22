class Content {
  constructor({ id, type, title, description, releaseYear, rating, liked = false }) {
    if (!id || !type || !title || !description || !releaseYear || rating == null) {
      throw new Error("Missing required content fields");
    }

    if (type !== "movie" && type !== "series") {
      throw new Error(`Invalid content type: ${type}`);
    }

    this.id = id;
    this.type = type;
    this.title = title;
    this.description = description;
    this.releaseYear = releaseYear;
    this.rating = rating;
    this.liked = liked;
  }
}
