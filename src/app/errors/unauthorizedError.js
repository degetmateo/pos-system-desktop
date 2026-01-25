const responses = require("../static/responses.js");
const GenericError = require("./genericError.js");

module.exports = class UnauthorizedError extends GenericError {
    constructor (message) {
        super(message || 'No estás autorizado.', responses.UNAUTHORIZED);
    };
};