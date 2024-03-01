/**
 * This file is part of the DVMFNE Manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const CsvHandler = require("./CsvHandler");
const SheetsCommunications = require("../SheetsCommunications");
const FneCommunications = require("./FneCommunications");

class AutoAcl {
    constructor(logger, server) {
        this.logger = logger;
        this.server = server;
        this.enabled = server.Sheets.enabled;

            this.intervalId = undefined;

        if (!this.enabled) {
            logger.warn("Sheets disabled but was created", "AUTO ACL");
        } else {
            this.sheetsCommunications = new SheetsCommunications(logger, this.server.Sheets.serviceAccountKeyFile, this.server.Sheets.sheetId);
        }
    }

     start(){
        if (this.enabled) {
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

                if (this.server.Sheets.autoUpdateFne) {
                    this.updateFne();
                }
            }, this.server.autoAclInterval * 1000 * 60);
        } else {
            this.logger.warn("Could not start AutoAcl with no rid source mode", "AUTO ACL");
        }
    }

    stop(){
        this.logger.info("Stopping Auto ACL", "AUTO ACL");
        clearInterval(this.intervalId);
    }

    updateFne() {
        this.logger.info("Updating FNE", "AUTO ACL");
        let fneCommunications = new FneCommunications(this.server, this.logger);

        fneCommunications.forceUpdate()
            .then(status => {
                if (status) {
                    this.logger.info("Updated FNE ACL", "AUTO ACL");
                } else {
                    this.logger.error("Failed to force update FNE", "AUTO ACL");
                }
            })
            .catch(status => {
                this.logger.error("Error updating FNE: " + status, "AUTO ACL");
            });
    }
}

module.exports = AutoAcl;