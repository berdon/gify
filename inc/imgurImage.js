function ImgurImage(imgurImage) {
	this._imgurImage = imgurImage;
}

ImgurImage.prototype.getRating = function() {
	return this._imgurImage.nsfw === true ? 'r' : 'g';
}

ImgurImage.prototype.getSize = function() {
	return this._imgurImage.size;
}

ImgurImage.prototype.getImageUrl = function(maxSize) {
	return this._imgurImage.link;
}

module.exports = ImgurImage;
