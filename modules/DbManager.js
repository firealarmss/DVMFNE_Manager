/**
 * This file is part of the DVMFNE Manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

class DbManager {
    constructor(dbFilePath, logger) {
        this.logger = logger;

        this.db = new sqlite3.Database(dbFilePath, (err) => {
            if (err) {
                this.logger.error('Could not connect to database' + err, "DB MANAGER");
            } else {
                this.logger.info('Connected to database', "DB MANAGER");
            }
        });
    }

    initialize() {
        this.db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT
        )`, (err) => {
            if (err) {
                this.logger.error('Error creating the table:' + err, "DB MANAGER");
            } else {
                this.db.get(`SELECT COUNT(*) as count FROM users`, [], (err, row) => {
                    if (row && row.count === 0) {
                        console.log("First time database setup");
                        const hash = bcrypt.hashSync('password', 8);
                        this.db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, ['admin', hash], (err) => {
                            if (err) {
                                this.logger.error('Error creating Default admin user:' + err, "DB MANAGER");
                            } else {
                                this.logger.info('Default admin user created', "DB MANAGER");
                            }
                        });
                    }
                });
            }
        });

        this.db.run(`CREATE TABLE IF NOT EXISTS fne_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            PeerMapInclusions TEXT
        )`, (err) => {
            if (err) {
                this.logger.error('Error creating the FNE table:' + err, "DB MANAGER");
            } else {
                this.logger.info('FNE table initialized', "DB MANAGER");
            }
        });

        this.db.run(`CREATE TABLE IF NOT EXISTS peer_info (
            peerId INTEGER PRIMARY KEY,
            name TEXT,
            email TEXT,
            phone TEXT,
            discordWebhookUrl TEXT,
            connectionState INTEGER
        )`, (err) => {
            if (err) {
                this.logger.error('Error creating the peer_info table:' + err, "DB MANAGER");
            } else {
                this.logger.info('Peer info table initialized', "DB MANAGER");
            }
        });

        // had to add for existing db's that update
        this.db.run(`ALTER TABLE peer_info ADD COLUMN connectionState INTEGER`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                this.logger.error('Error adding connectionState column to the peer_info table:' + err, "DB MANAGER");
            } else {
                this.logger.info('connectionState column added to the peer_info table or already exists', "DB MANAGER");
            }
        });
    }

    changePeerConnectionState(peerId, connectionState, callback) {
        this.db.run(
            `UPDATE peer_info SET connectionState = ? WHERE peerId = ?`,
            [connectionState, peerId],
            (err) => {
                callback(err);
            }
        );
    }

    updatePeerInfo(peerId, name, email, phone, discordWebhookUrl, callback) {
        this.db.run(
            `UPDATE peer_info SET name = ?, email = ?, phone = ?, discordWebhookUrl = ? WHERE peerId = ?`,
            [name, email, phone, discordWebhookUrl, peerId],
            (err) => {
                callback(err);
            }
        );
    }

    addPeerInfo(peerId, name, email, phone, discordWebhookUrl, callback) {
        this.db.run(`INSERT INTO peer_info (peerId, name, email, phone, discordWebhookUrl) VALUES (?, ?, ?, ?, ?)`,
            [peerId, name, email, phone, discordWebhookUrl], (err) => {
                callback(err);
            });
    }

    deletePeerInfo(peerId, callback) {
        this.db.run(`DELETE FROM peer_info WHERE peerId = ?`, [peerId], (err) => {
            callback(err);
        });
    }

    getPeerInfo(peerId, callback) {
        this.db.get(`SELECT * FROM peer_info WHERE peerId = ?`, [peerId], (err, row) => {
            callback(err, row);
        });
    }

    getAllPeerInfos(callback) {
        this.db.all(`SELECT * FROM peer_info`, [], (err, rows) => {
            callback(err, rows);
        });
    }

    addPeerMapInclusion(PeerMapInclusions, callback) {
        this.db.run(`INSERT INTO fne_data (PeerMapInclusions) VALUES (?)`, [PeerMapInclusions], (err) => {
            callback(err);
        });
    }

    deletePeerMapInclusion(id, callback) {
        this.db.run(`DELETE FROM fne_data WHERE id = ?`, [id], (err) => {
            callback(err);
        });
    }

    getAllPeerMapInclusions(callback) {
        this.db.all(`SELECT * FROM fne_data`, [], (err, rows) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, rows);
            }
        });
    }

    editUser(userId, username, password, callback) {
        let sql = `UPDATE users SET username = ? WHERE id = ?`;
        let params = [username, userId];

/*        if (password) {
            const hash = bcrypt.hashSync(password, 8);
            sql = `UPDATE users SET username = ?, password = ? WHERE id = ?`;
            params = [username, hash, userId];
        }*/

        this.db.run(sql, params, (err) => {
            callback(err);
        });
    }
    getUser(username, callback) {
        return this.db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
            callback(err, row);
        });
    }

    addUser(username, password, callback) {
        const hash = bcrypt.hashSync(password, 8);
        this.db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hash], (err) => {
            callback(err);
        });
    }

    getAllUsers(callback) {
        return this.db.all(`SELECT * FROM users`, [], (err, rows) => {
            callback(err, rows);
        });
    }

    deleteUser(userId, callback) {
        this.db.run(`DELETE FROM users WHERE id = ?`, [userId], (err) => {
            callback(err);
        });
    }
    validateUser(username, password, callback) {
        this.getUser(username, (err, user) => {
            if (user && bcrypt.compareSync(password, user.password)) {
                callback(null, user);
            } else {
                callback('Invalid username or password');
            }
        });
    }
}

module.exports = DbManager;
