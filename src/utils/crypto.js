const crypto = require("node:crypto");

const uuid = () => crypto.randomBytes(20).toString('hex');

module.exports = {
    uuid,
}