/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 *
 * Some lingo is directly from https://github.com/DVMProject/dvmhost
 */

const axios = require('axios');
const crypto = require('crypto');

class RESTClient {
    constructor(address, port, password, debug = false, logger) {
        this.address = address;
        this.port = port;
        this.password = password;
        this.debug = debug;
        this.logger = logger;
    }

    async send(method, endpoint, payload) {
        if (!this.address) {
            throw new Error("ERRNO_NO_ADDRESS");
        }
        if (this.port <= 0) {
            throw new Error("ERRNO_NO_PORT");
        }
        if (!this.password) {
            throw new Error("ERRNO_NO_PASSWORD");
        }

        const baseURL = `http://${this.address}:${this.port}`;

        try {
            const hash = crypto.createHash('sha256').update(this.password).digest('hex');

            const authResponse = await axios({
                method: 'PUT',
                url: `${baseURL}/auth`,
                data: {
                    auth: hash
                }
            });

            const { status, token } = authResponse.data;
            if (status !== 200 || !token) {
                throw new Error(`ERRNO_BAD_AUTH_RESPONSE. Server said: ${JSON.stringify(authResponse.data)}`);
            }

            const apiResponse = await axios({
                method,
                url: `${baseURL}${endpoint}`,
                headers: {
                    'X-DVM-Auth-Token': token
                },
                data: payload
            });

            if (this.debug) {
                console.log(`REST Response: ${JSON.stringify(apiResponse.data)}`);
            }

            return apiResponse.data;

        } catch (error) {
            console.error("Error:", error.message);
            throw new Error("ERRNO_INTERNAL_ERROR");
        }
    }
}

module.exports = RESTClient;