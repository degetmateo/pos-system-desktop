const GenericError = require("../errors/GenericError.js");
const responses = require("../static/responses.js");

module.exports.ResponseOk = (res, statusCode, data) => {
    return res.status(statusCode).json({ data });
};

module.exports.ResponseError = (res, error) => {
    if (error instanceof GenericError) return res.status(error.statusCode).json(error);
    else return res.status(responses.INTERNAL_SERVER_ERROR).json({ error: { message: 'Ha ocurrido un error inesperado.' } });
};