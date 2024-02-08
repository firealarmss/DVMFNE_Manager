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
const SheetsCommunications = require('./SheetsCommunications');
const CsvHandler = require('./CsvHandler');

class ManagerServer {
     constructor(server, config, dbManager, logger) {

        this.config = config;
        this.server = server;

        this.app = express();
        this.initializedApp = null;

        this.logger = logger;

        this.dbManager = dbManager;

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
            res.locals.sheets = this.server.Sheets.enabled;
            next();
        });

        this.dbManager.initialize();

        this.sheetsCommunications = new SheetsCommunications(this.server.Sheets.serviceAccountKeyFile, this.server.Sheets.sheetId);

        this.app.get('/', (req, res) => {
            res.render('system_landing');
        });

        this.app.get('/manageWatchedPeers', this.isAuthenticated, async (req, res) => {
            try {
                this.dbManager.getAllPeerInfos((err, peers) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Database error');
                    }
                    res.render('manageWatchedPeers', { peers });
                });
            } catch (error) {
                console.error(error);
                res.status(500).send('Server error');
            }
        });

         this.app.post('/editWatchedPeer/:peerId', (req, res) => {
             const peerId = req.params.peerId;
             const { name, email, phone, discordWebhookUrl } = req.body;

             this.dbManager.updatePeerInfo(peerId, name, email, phone, discordWebhookUrl, (err) => {
                 if (err) {
                     console.error(err);
                     return res.status(500).send('Database error');
                 }
                 res.redirect('/manageWatchedPeers');
             });
         });

         this.app.post('/deleteWatchedPeer/:peerId', (req, res) => {
             const peerId = req.params.peerId;
             this.dbManager.deletePeerInfo(peerId, (err) => {
                 if (err) {
                     console.error(err);
                     return res.status(500).send('Database error');
                 }
                 res.redirect('/manageWatchedPeers');
             });
         });

         this.app.post('/addWatchedPeer', (req, res) => {
             const { peerId, name, email, phone, discordWebhookUrl } = req.body;
             this.dbManager.addPeerInfo(peerId, name, email, phone, discordWebhookUrl, (err) => {
                 if (err) {
                     console.error(err);
                     return res.status(500).send('Database error');
                 }
                 res.redirect('/manageWatchedPeers');
             });
         });

        this.app.get('/getRidSheet', async (req, res) => {
            let response = await this.sheetsCommunications.read(this.server.Sheets.RidAcl.range, this.server.Sheets.RidAcl.tab);
            response = response.filter(row => !row[0].includes('#'));

            res.render('ridAclSheets', { ridAcl: response });
        });

        this.app.get('/pushRidAclToFne', this.isAuthenticated, async (req, res) => {
            let csvHandler = new CsvHandler(this.logger);
            let response = await this.sheetsCommunications.read(this.server.Sheets.RidAcl.range, this.server.Sheets.RidAcl.tab);

            if (!response) {
                res.sendStatus(500);
            }

            response = response.filter(row => !row[0].includes('#'));
            csvHandler.write(this.server.RidAclPath, csvHandler.sheetAclToCsv(response).trim());
            res.redirect('/?message=Pushed RID ACL to FNE');
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

                    const groupedPeers = filteredPeers.reduce((acc, peer) => {
                        if (!peer.config.info || !peer.config.info.latitude || !peer.config.info.longitude) {
                            console.warn(`Skipped peer with incomplete info: ${peer.peerId}`);
                            return acc;
                        }

                        const lat = peer.config.info.latitude.toFixed(4); // 4 decimal places
                        const lng = peer.config.info.longitude.toFixed(4); // 4 decimal places
                        const key = `${lat},${lng}`;

                        if (!acc[key]) {
                            acc[key] = {
                                latitude: lat,
                                longitude: lng,
                                location: peer.config.info.location,
                                peers: []
                            };
                        }

                        acc[key].peers.push(peer);
                        return acc;
                    }, {});

                    res.render('peerMap', {
                        name: this.name,
                        peers: Object.values(groupedPeers),
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

        /*
         *   API Routes
         */

        this.app.get('/api/stats', async (req, res) => {
            let affiliationCount = 0;
            let fneCommunications = new FneCommunications(this.server, this.logger);
            let affResponse = await fneCommunications.getFneAffiliationList();
            let peerResponse = await fneCommunications.getFnePeerList();

            if (!affResponse || !peerResponse) {
                res.status(500).send("Error getting aff or peer list");
                return;
            }

            await affResponse.affiliations.forEach(peer => {
                peer.affiliations.forEach(affiliation => {
                    affiliationCount++;
                });
            });

            res.send({ affiliationCount: affiliationCount,
                peerCount: peerResponse.peers.length,
                affiliationList: affResponse.affiliations
            });
        });

        this.app.get('*', function(req, res){
            res.render('errors/404');
        });
    }

    start() {
        this.initializedApp = this.app.listen(this.port, this.ServerBindAddress, () => {
            this.logger.info(`${this.name} TG Manager Server started on port ${this.port}`, "MANAGER SERVER");
        });
    }

    stop() {
        this.initializedApp.close(() => {
            this.logger.info(`Stopped ${this.name}`, "MANAGER SERVER");
        });
    }

    restart() {
        this.initializedApp.close(() => {
            this.logger.info(`Stopped ${this.name}; Restarting`, "MANAGER SERVER");

            setTimeout(() => {
                this.initializedApp = this.app.listen(this.port, this.ServerBindAddress, () => {
                    this.logger.info(`${this.name} TG Manager Server started on port ${this.port}`, "MANAGER SERVER");
                });
            }, 1000);
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