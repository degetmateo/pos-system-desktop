const keytar = require('keytar');
const { SERVICE } = require('../static/consts');
const jwt = require('jsonwebtoken');
const UnauthorizedError = require('../errors/unauthorizedError');

class JWT {
    async generate (data, expiresIn = '1h') {
        const storedPassword = await keytar.getPassword(SERVICE, 'password');
        
        return new Promise((resolve, reject) => {
            jwt.sign({ data }, storedPassword, { expiresIn}, (err, token) => {
                if (err) return reject(err);
                resolve(token);
            });
        });
    };

    async verify (token) {
        try {
            const storedPassword = await keytar.getPassword(SERVICE, 'password');
            const { data } = jwt.verify(token, storedPassword);
            return data;
        } catch (error) {
            throw new UnauthorizedError();
        };
    };
};

module.exports = new JWT();