/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const { google } = require('googleapis');

class SheetsCommunications {
    constructor(serviceAccountKeyFile, sheetId) {
        this.serviceAccountKeyFile = serviceAccountKeyFile;

        this.sheetId = sheetId;

        this.googleSheetClient = undefined;
    }

    async initialize() {
        this.googleSheetClient = await this.getSheetClient();
    }

    async getTabs() {
        if (!this.googleSheetClient) {
            await this.initialize();
        }
        const res = await this.googleSheetClient.spreadsheets.get({
            spreadsheetId: this.sheetId,
            ranges: [],
            includeGridData: false,
        });

        const sheets = res.data.sheets;
        const tabs = sheets.map(sheet => sheet.properties.title);

        const tabsToRemove = ["rid_acl"];
        return tabs.filter(tab => !tabsToRemove.includes(tab));
    }

    async read(range, tab) {
        if (!this.googleSheetClient) {
            await this.initialize();
        }

        const res = await this.googleSheetClient.spreadsheets.values.get({
            spreadsheetId: this.sheetId,
            range: `${tab}!${range}`,
        });
        return res.data.values;
    }

    async write(range, data, tab) {
        if (!this.googleSheetClient) {
            await this.initialize();
        }

        await this.googleSheetClient.spreadsheets.values.append({
            spreadsheetId: this.sheetId,
            range: `${tab}!${range}`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                "majorDimension": "ROWS",
                "values": data
            },
        })
    }

    async updateSheet(range, data, tab) {
        if (!this.googleSheetClient) {
            await this.initialize();
        }

        await this.googleSheetClient.spreadsheets.values.update({
            spreadsheetId: this.sheetId,
            range: `${tab}!${range}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                "majorDimension": "ROWS",
                "values": data
            },
        });
    }

    async getSheetClient() {
        const auth = new google.auth.GoogleAuth({
            keyFile: this.serviceAccountKeyFile,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const authClient = await auth.getClient();
        return google.sheets({
            version: 'v4',
            auth: authClient,
        });
    }
}

module.exports = SheetsCommunications;