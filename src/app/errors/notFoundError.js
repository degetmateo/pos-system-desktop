const responses = require("../static/responses.js");
const GenericError = require("./genericError.js");

module.exports = class NotFoundError extends GenericError {
    constructor (message) {
        super(message || 'No se ha encontrado el recurso solicitado.', responses.NOT_FOUND);
    };
};