/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const TgRulesHandler = require('./TgRulesHandler.js');
const DbManager = require('./DbManager');
const FneCommunications = require('./FneCommunications');
const Logger = require('./Logger');

class ManagerServer {
    constructor(server, config, logger) {

        this.config = config;
        this.server = server;

        this.app = express();
        this.initializedApp = null;

        this.logger = logger

        this.dbManager = new DbManager("./db/users.db", this.logger);

        this.port = server.ServerPort || 3000;
        this.name = server.name;
        this.type = server.type;
        this.ServerBindAddress = server.ServerBindAddress || "0.0.0.0";
        this.RulePath = server.RulePath;

        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '..', 'views'));
        this.app.use('/public', express.static('public'))

        this.app.use(express.json());
        this.app.use(bodyParser.json());

        this.app.use(bodyParser.urlencoded({ extended: true }));

        this.app.set('trust proxy', true);

        this.app.use(session({
            secret: 'your_secret_key',
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false }
        }));

        this.app.use((req, res, next) => {
            if (req.session && req.session.user) {
                res.locals.user = req.session.user;
            } else {
                res.locals.user = null;
            }
            res.locals.name = this.name;
            next();
        });

        this.dbManager.initialize();

        this.app.get('/', (req, res) => {
            res.render('system_landing');
        });

        this.app.get('/peerMapInclusions', this.isAuthenticated, (req, res) => {
            this.dbManager.getAllPeerMapInclusions((err, inclusions) => {
                if (err) {
                    res.send("Error retrieving inclusions");
                } else {
                    res.render('peerMapInclusions', { inclusions: inclusions });
                }
            });
        });

        this.app.post('/addInclusion', (req, res) => {
            const peerId = req.body.PeerMapInclusions;
            this.dbManager.addPeerMapInclusion(peerId, (err) => {
                if (err) {
                    res.send("Error adding PeerMapInclusion");
                } else {
                    res.redirect('/peerMapInclusions');
                }
            });
        });

        this.app.post('/deleteInclusion/:id', (req, res) => {
            const id = req.params.id;
            this.dbManager.deletePeerMapInclusion(id, (err) => {
                if (err) {
                    res.send("Error deleting PeerMapInclusion");
                } else {
                    res.redirect('/peerMapInclusions');
                }
            });
        });

        this.app.get('/overview', (req, res) => {
            res.render('overview', { config: this.config });
        });

        this.app.get('/fneForceUpdate', this.isAuthenticated, (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);

            fneCommunications.forceUpdate()
                .then(status => {
                    if (status) {
                        res.send("Success!")
                        this.logger.dbug("Force Update FNE request", "MANAGER SERVER");
                        console.log(status);
                    } else {
                        res.send("Fail");
                    }
                })
                .catch(status => {
                    res.send("error");
                    this.logger.dbug(status, "MANAGER SERVER");
                });
        });

        this.app.get('/fnePeerMap', async (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);
            let response = await fneCommunications.getFnePeerList();
            if (!response) {
                res.send("Error getting peer list");
                return;
            }
            this.dbManager.getAllPeerMapInclusions((err, inclusions) => {
                if (err) {
                    res.send("Error retrieving inclusions");
                } else {
                    const peerMapInclusionSet = new Set(inclusions.map(item => String(item.PeerMapInclusions).trim()));

                    const filteredPeers = req.session.user ?
                        response.peers :
                        response.peers.filter(peer => peerMapInclusionSet.has(String(peer.peerId).trim()));

                    res.render('peerMap', {
                        name: this.name,
                        peers: filteredPeers,
                        PeerMapInclusions: inclusions,
                    });
                }
            });
        });

        this.app.get('/fnePeerList', this.isAuthenticated, async (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);
            let response = await fneCommunications.getFnePeerList();
            if (!response) {
                res.send("Error getting peer list");
                return;
            }
            res.render("peerList", { peers: response.peers });
        });

        this.app.get('/fneAffiliationList', async (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);
            let response = await fneCommunications.getFneAffiliationList();
            if (!response) {
                res.send("Error getting peer list");
                return;
            }

            res.render("affiliationList", { peers: response.affiliations });
        });

        this.app.get('/fneStatus', this.isAuthenticated, async (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);
            let response = await fneCommunications.getFneStatus();
            res.send(response);
        });

        this.app.get('/restartFne', this.isAuthenticated, (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);

            fneCommunications.restartFneService()
                .then(status => {
                    if (status) {
                        res.send("Success!")
                        this.logger.dbug("Restart FNE request", "MANAGER SERVER");
                        this.logger.dbug(status, "MANAGER SERVER");
                    } else {
                        res.send("Fail");
                    }
                })
                .catch(status => {
                    res.send("error");
                    this.logger.dbug(status, "MANAGER SERVER");
                });
        });

        this.app.get('/startFne', this.isAuthenticated, (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);

            fneCommunications.startFneService()
                .then(status => {
                    if (status) {
                        res.send("Success!")
                        this.logger.dbug("Start FNE request", "MANAGER SERVER");
                        console.log(status);
                    } else {
                        res.send("Fail");
                    }
                })
                .catch(status => {
                    res.send("error");
                    console.log(status);
                });
        });

        this.app.get('/stopFne', this.isAuthenticated, (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);

            fneCommunications.stopFneService()
                .then(status => {
                    if (status) {
                        res.send("Success!")
                        this.logger.dbug("Stop FNE request", "MANAGER SERVER");
                        console.log(status);
                    } else {
                        res.send("Fail");
                    }
                })
                .catch(status => {
                    res.send("error");
                    console.log(status);
                });
        });

        this.app.get('/fneServiceStatus', this.isAuthenticated, (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);

            fneCommunications.getFneServiceStatus()
                .then(status => {
                    if (status) {
                        res.send(fneCommunications.commandOutput);
                        this.logger.dbug("FNE Status: " + fneCommunications.commandOutput, "MANAGER SERVER");
                        console.log(status);
                    } else {
                        res.send("Fail");
                    }
                })
                .catch(status => {
                    res.send("error");
                    this.logger.error("Error getting FNE status", "MANAGER SERVER");
                    console.error(status);
                });
        });

        this.app.get('/tg_rules', this.isAuthenticated, (req, res) => {
            let tgRulesHandler = new TgRulesHandler(this.RulePath, this.logger);

            tgRulesHandler.read();
            //console.log(tgRulesHandler.rules);
            if (this.type === "FNE2") {
                res.render('tg_rules', {
                    rules: tgRulesHandler.rules,
                    name: this.name
                });
            } else if (this.type === "CFNE") {
                res.render('cfne_rules', {
                    rules: tgRulesHandler.rules,
                    groups: tgRulesHandler.rules,
                    name: this.name
                });
            } else {
                res.send("Invalid FNE type");
            }
        });

        this.app.post('/auth', (req, res) => {
            const { username, password } = req.body;

            const ip = req.ip;

            this.logger.info(`Auth Request; User: ${username}; IP: ${ip}`, "MANAGER SERVER");

            this.dbManager.validateUser(username, password, (err, user) => {
                if (user) {
                    req.session.user = user;
                    this.logger.info(`Auth Request granted; User: ${user.username}; IP: ${ip}`, "MANAGER SERVER");

                    res.redirect('/');
                } else {
                    this.logger.info(`Auth Request failed; User: ${username}; IP: ${ip}`, "MANAGER SERVER");

                    res.render('login', { message: 'Invalid username or password' });
                }
            });
        });

        this.app.get('/login', (req, res) => {
            res.render('login', { message: null});
        });

        this.app.get('/logout', (req, res) => {
            req.session.destroy();
            res.redirect('/');
        });

        this.app.get('/users', this.isAuthenticated, (req, res) => {
            this.dbManager.getAllUsers((err, users) => {
                if (err) {
                    res.send("Error retrieving users");
                } else {
                    res.render('userManagment', { users: users });
                }
            });
        });

        this.app.post('/deleteUser', this.isAuthenticated, (req, res) => {
            this.dbManager.deleteUser(req.body.id, (err) => {
                if (err) {
                    res.send("Error deleting user");
                } else {
                    res.redirect('/users');
                }
            });
        });

        this.app.post('/addUser', this.isAuthenticated, (req, res) => {
            const { username, password } = req.body;

            this.dbManager.getUser(username, (err, user) => {
                if (user) {
                    res.redirect('/users?error=User already exists');
                } else {
                    this.dbManager.addUser(username, password, (err) => {
                        if (err) {
                            console.log('Error adding user:', err);
                            res.redirect('/users?error=Error adding user');
                        } else {
                            res.redirect('/users?success=User added successfully');
                        }
                    });
                }
            });
        });

        this.app.post('/editUser', this.isAuthenticated, (req, res) => {
            const { id, username, password } = req.body;
            this.dbManager.editUser(id, username, password, (err) => {
                if (err) {
                    console.log('Error editing user:', err);
                    res.redirect('/users?error=Error editing user');
                } else {
                    res.redirect('/users?success=User edited successfully');
                }
            });
        });

        this.app.post('/writeTgRuleChanges', this.isAuthenticated, (req, res) => {
            let rules = req.body;
            let tgRulesHandler = new TgRulesHandler(this.RulePath, this.logger);

            tgRulesHandler.write(rules);

            res.sendStatus(200);
        });
    }

    start() {
        this.initializedApp = this.app.listen(this.port, this.ServerBindAddress, () => {
            this.logger.info(`${this.name} TG Manager Server started on port ${this.port}`, "MANAGER SERVER");
        });
    }

    stop() {
        this.initializedApp.close();
        this.logger.info(`Stopped ${this.name}`, "MANAGER SERVER");
    }

    restart() {
        this.initializedApp.close(() => {
           this.logger.info(`Stopped ${this.name}; Restarting`, "MANAGER SERVER");

            this.initializedApp = this.app.listen(this.port, this.ServerBindAddress, () => {
                this.logger.info(`${this.name} TG Manager Server started on port ${this.port}`, "MANAGER SERVER");
            });
        });
    }

    isAuthenticated(req, res, next) {
        if (req.session && req.session.user) {
            return next();
        } else {
            return res.redirect('/');
        }
    }
}

module.exports = ManagerServer;