const GenericError = require("../errors/genericError.js");
const responses = require("../static/responses.js");

module.exports.ResponseOk = (res, statusCode = 200, data) => {
    return res.status(statusCode).json({ data });
};

module.exports.ResponseFile = (res, file) => {
    return res.status(responses.OK).sendFile(file);
};

module.exports.ResponseError = (res, error) => {
    if (error instanceof GenericError) return res.status(error.statusCode).json({ error });
    else return res.status(responses.INTERNAL_SERVER_ERROR).json({ error: { message: 'Ha ocurrido un error inesperado.' } });
};

module.exports.ResponseExcel = async (res, book, filename) => {
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
        'Content-Disposition', 
        'attachment; filename=' + `${filename}.xlsx`
    );

    res.status(responses.OK);
    await book.xlsx.write(res);
    res.end();
};