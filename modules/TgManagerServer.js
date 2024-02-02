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

class TgManagerServer {
    constructor(server, config) {

        this.config = config;
        this.server = server;

        this.app = express();

        this.logger = new Logger(true, this.name, null, 0);

        this.dbManager = new DbManager("./db/users.db", this.logger);

        this.port = server.ServerPort || 3000;
        this.name = server.name;
        this.ServerBindAddress = server.ServerBindAddress || "0.0.0.0";
        this.RulePath = server.RulePath;

        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '..', 'views'));
        this.app.use('/public', express.static('public'))

        this.app.use(express.json());
        this.app.use(bodyParser.json());

        this.app.use(bodyParser.urlencoded({ extended: true }));

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

        this.app.get('/overview', (req, res) => {
            res.render('overview', { config: this.config });
        });

        this.app.get('/restartFne', this.isAuthenticated, (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);

            fneCommunications.restartFneService()
                .then(status => {
                    if (status) {
                        res.send("Success!")
                        this.logger.debug(status, "MANAGER SERVER");
                    } else {
                        res.send("Fail");
                    }
                })
                .catch(status => {
                    res.send("error");
                    this.logger.debug(status, "MANAGER SERVER");
                });
        });

        this.app.get('/startFne', this.isAuthenticated, (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);

            fneCommunications.startFneService()
                .then(status => {
                    if (status) {
                        res.send("Success!")
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

        this.app.get('/fneStatus', this.isAuthenticated, (req, res) => {
            let fneCommunications = new FneCommunications(this.server, this.logger);

            fneCommunications.getFneServiceStatus()
                .then(status => {
                    if (status) {
                        res.send(fneCommunications.commandOutput);
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

        this.app.get('/tg_rules', this.isAuthenticated, (req, res) => {
            let tgRulesHandler = new TgRulesHandler(this.RulePath, this.logger);
            tgRulesHandler.read();
            //console.log(JSON.stringify(tgRulesHandler.rules));

            res.render('tg_rules', {
                rules: tgRulesHandler.rules,
                name: this.name
            });
        });

        this.app.post('/auth', (req, res) => {
            const { username, password } = req.body;
            this.dbManager.validateUser(username, password, (err, user) => {
                if (user) {
                    req.session.user = user;
                    res.redirect('/');
                } else {
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

            //  console.log(JSON.stringify(rules))
            res.sendStatus(200);
        });
    }

    start() {
        this.app.listen(this.port, this.ServerBindAddress, () => {
            this.logger.info(`${this.name} TG Manager Server started on port ${this.port}`, "MANAGER SERVER");
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

module.exports = TgManagerServer;