const responses = require("../static/responses.js");
const GenericError = require("./genericError.js");

module.exports = class InvalidArgumentError extends GenericError {
    constructor (message) {
        super(message || 'Hay un error con los datos recibidos.', responses.NOT_ACCEPTABLE);
    };
};