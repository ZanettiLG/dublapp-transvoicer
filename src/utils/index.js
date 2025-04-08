const crypto = require("./crypto");
const mediaEncoder = require("./media-encoder");

const sanetizeText = (text) => {
    return text.replace(/\.$/gi, "").trim();
}

module.exports = {
    ...crypto,
    ...mediaEncoder,
    sanetizeText,
}