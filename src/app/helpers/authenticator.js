const keytar = require('keytar');
const { SERVICE } = require('../static/consts');
const UnauthorizedError = require('../errors/unauthorizedError');
const JWT = require('./jwt');
const { ResponseError } = require('./controllerResponse');

class Authenticator {
    async has_account () {
        const storedUsername = await keytar.getPassword(SERVICE, 'username');
        const storedPassword = await keytar.getPassword(SERVICE, 'password');

        return storedUsername !== null && storedPassword !== null;
    };

    async sign_up (username, password) {
        await keytar.setPassword(SERVICE, 'username', username);
        await keytar.setPassword(SERVICE, 'password', password);
    };

    async sign_in (username, password) {
        const storedUsername = await keytar.getPassword(SERVICE, 'username');
        const storedPassword = await keytar.getPassword(SERVICE, 'password');

        return username === storedUsername && password === storedPassword;
    };

    async authorization (req, res, next) {
        try {
            const header = req.headers['authorization']?.split(" ");
            if (!header) throw new UnauthorizedError("Authorization failed.");

            const token = header[1];
            if (!token) throw new UnauthorizedError("Authorization failed.");
            
            const data = await JWT.verify(token);
            
            req.user = data;
            next();
        } catch (error) {
            console.error(error);
            ResponseError(res, error);
        };
    };
};

module.exports = new Authenticator();