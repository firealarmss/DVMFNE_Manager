

const fs = require('fs');

class CsvHandler {
    constructor(logger) {
        this.logger = logger;
    }

    sheetAclToCsv(acl) {
        let csv = '';

        acl.forEach(row => {
            const rowString = row.join(',');
            csv += rowString + ',\n';
        });

        return csv;
    }

    read(){
        /* stub */
    }

    write(path, data){
        fs.writeFile(path, data, (err)=> {
            if(err) {
                return console.log(err);
            }
            this.logger.info(`CSV file saved to ${path}`, "CSV HANDLER");
        });
    }
}

module.exports = CsvHandler;