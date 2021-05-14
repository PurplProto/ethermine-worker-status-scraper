#!/usr/bin/env node
import yargs = require('yargs/yargs');
import helpers = require('yargs/helpers');
import { argv } from 'yargs';

yargs(helpers.hideBin(process.argv))
    .option('url', {
        alias: 'u',
        type: 'string',
        description: 'URL to parse the worker status from',
    })
    .argv;

console.log(argv);
