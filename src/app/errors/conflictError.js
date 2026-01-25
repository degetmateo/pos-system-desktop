const responses = require("../static/responses.js");
const GenericError = require("./genericError.js");

module.exports = class ConflictError extends GenericError {
    constructor (message) {
        super(message || 'Existe un conflicto con los datos ingresados.', responses.CONFLICT);
    };
};