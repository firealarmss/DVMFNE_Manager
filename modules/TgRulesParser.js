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

class TgRulesParser{
    constructor(ruleFilePath) {
        this.ruleFilePath = ruleFilePath;
    }
}

module.exports(TgRulesParser);