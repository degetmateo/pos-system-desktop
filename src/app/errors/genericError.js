const responses = require("../static/responses.js");

module.exports = class GenericError extends Error {
    statusCode;

    constructor (message, statusCode) {
        super();
        this.message = message || 'Ha ocurrido un error inesperado.';
        this.statusCode = statusCode || responses.INTERNAL_SERVER_ERROR;
    };
};