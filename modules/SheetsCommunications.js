/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const { google } = require('googleapis');

const googleSheetClient = await getGoogleSheetClient();

class SheetsCommunications {
    constructor() {

    }

    async initialize() {
    }

    async getSheetTabs(googleSheetClient, sheetId) {
        const res = await googleSheetClient.spreadsheets.get({
            spreadsheetId: sheetId,
            ranges: [],
            includeGridData: false,
        });

        const sheets = res.data.sheets;
        const tabs = sheets.map(sheet => sheet.properties.title);

        const tabsToRemove = ["rid_acl"];
        return tabs.filter(tab => !tabsToRemove.includes(tab));
    }

    async readGoogleSheet(googleSheetClient, sheetId, tabName, range) {
        const res = await googleSheetClient.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${tabName}!${range}`,
        });
        return res.data.values;
    }

    async writeGoogleSheet(googleSheetClient, sheetId, tabName, range, data) {
        await googleSheetClient.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: `${tabName}!${range}`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                "majorDimension": "ROWS",
                "values": data
            },
        })
    }

    async updateGoogleSheet(googleSheetClient, sheetId, tabName, range, data) {
        await googleSheetClient.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `${tabName}!${range}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                "majorDimension": "ROWS",
                "values": data
            },
        });
    }
}