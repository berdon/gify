function GiphyImage(giphyImage) {
	this._giphyImage = giphyImage;
}

GiphyImage.prototype.getRating = function() {
	return this._giphyImage.rating || 'pg-13';
}

GiphyImage.prototype.getSize = function() {
	// Return our smallest available size
	return this._giphyImage.images.fixed_height_downsampled.size;
}

GiphyImage.prototype.getImageUrl = function(maxSize) {
	if (maxSize) {
		if (this._giphyImage.images.original.size <= maxSize) {
			return this._giphyImage.images.original.url;
		} else if (this._giphyImage.images.fixed_height.size <= maxSize) {
			return this._giphyImage.images.fixed_height.url;
		} else if (this._giphyImage.images.fixed_height_downsampled.size <= maxSize) {
			return this._giphyImage.images.fixed_height_downsampled.url;
		}
	}

	return this._giphyImage.images.original.url;
}

module.exports = GiphyImage;