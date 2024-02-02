/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const fs = require('fs');

class Logger {
    constructor(debug, systemName, logFile, logLevel) {
        this.debug = debug;
        this.systemName = systemName;
        this.logFile = logFile;
        this.logLevel = logLevel;
    }

    error(message, location = null) {
        const locationPart = location ? `[${location}] ` : '';
        console.error(`[${this.getDateTime()}] [ERROR] ${locationPart}${message}`);
        this.writeLogFile(`[${this.getDateTime()}] [ERROR] ${locationPart}${message}`);
    }

    warn(message, location = null) {
        const locationPart = location ? `[${location}] ` : '';
        console.log(`[${this.getDateTime()}] [INFO] ${locationPart}${message}`);
        this.writeLogFile(`[${this.getDateTime()}] [INFO] ${locationPart}${message}`);
    }

    info(message, location = null) {
        const locationPart = location ? `[${location}] ` : '';
        console.log(`[${this.getDateTime()}] [INFO] ${locationPart}${message}`);
        this.writeLogFile(`[${this.getDateTime()}] [INFO] ${locationPart}${message}`);
    }

    debug(message, location = null) {
        if (this.debug) {
            const locationPart = location ? `[${location}] ` : '';
            console.log(`[${this.getDateTime()}] [DEBUG] ${locationPart}${message}`);
            this.writeLogFile(`[${this.getDateTime()}] [DEBUG] ${locationPart}${message}`);
        }
    }

    writeLogFile(message) {
        if (this.logFile) {
            fs.appendFile(this.logFile, message, (err) => {
                if (err) {
                    console.error(`Error writing to log file: ${err}`);
                }
            });
        }
    }

    getDateTime() {
        let date = new Date();
        return date.toISOString();
    }
}

module.exports = Logger;