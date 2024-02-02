/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const fs = require('fs');
const yaml = require('js-yaml');

class TgRulesHandler {
    constructor(ruleFilePath, logger) {
        this.ruleFilePath = ruleFilePath;
        this.logger = logger;
    }

    read(){
        try {
            this.rules = yaml.load(fs.readFileSync(this.ruleFilePath, 'utf8'));
        } catch (e) {
            console.log("Error reading tg rule file: " + e);
        }
    }

    write(rules){
        try {
            fs.writeFile(this.ruleFilePath, yaml.dump(rules), (err) => {
                if (err) {
                    console.log("Error writing tg rule file: " + err);
                }
            });
        } catch (e) {
            console.log("Error writing tg rule file: " + e);
        }
    }
}

module.exports = TgRulesHandler;