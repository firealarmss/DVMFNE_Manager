/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const CsvHandler = require("./CsvHandler");
const SheetsCommunications = require("./SheetsCommunications");


class AutoAcl {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;

        this.intervalId = undefined;

        this.sheetsCommunications = new SheetsCommunications(this.server.Sheets.serviceAccountKeyFile, this.server.Sheets.sheetId);
    }

     start(){
        this.logger.info("Started Auto ACL", "AUTO ACL");

        this.intervalId = setInterval(async () => {
            this.logger.info("Updating ACL", "AUTO ACL");
            let csvHandler = new CsvHandler(this.logger);
            let response = await this.sheetsCommunications.read(this.server.Sheets.RidAcl.range, this.server.Sheets.RidAcl.tab);

            if (!response) {
                this.logger.error("Failed to read ACL from Google Sheets", "AUTO ACL");
            }

            response = response.filter(row => !row[0].includes('#'));
            csvHandler.write(this.server.RidAclPath, csvHandler.sheetAclToCsv(response).trim());
            this.logger.info("Saved " + response.length + " entry's to ACL", "AUTO ACL");
        }, this.server.AutoAclInterval * 1000 * 60);
    }

    stop(){
        this.logger.info("Stopping Auto ACL", "AUTO ACL");
        clearInterval(this.intervalId);
    }
}

module.exports = AutoAcl;