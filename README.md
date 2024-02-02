# FNE2 TG Manager

[![License](https://img.shields.io/badge/License-GPLv3-blue?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)

Manage FNE2 Talk Groups

## Getting started

Install node js

### Install Requirements

`npm i`

`npm i -g pkg` (if you want to compile the app)

### Compile
`npm run build`

Binary will be in the `bin` folder. By default, it will be named `fne2-tg-manager-os type`

### Running FNE2 TG Manager

If you want to specify your own config file:
```bash
node index.js -c configs/config.yml
```

To just run the app (make sure you have a `config.yml` file in the `configs` folder):

```bash
npm run start
```

### Configure



Edit the `config.yml` file to your needs

## Todo

Add support for "Converged FNE"