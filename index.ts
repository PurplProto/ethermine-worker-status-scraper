#!/usr/bin/env node
import cheerioLad from 'cheerio';
import puppetMaster from 'puppeteer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

let loggingEnabled = false;

function doLogThings(message: string) {
  if (loggingEnabled) {
    console.log(message);
  }
}

async function castThyStatusUponYe(url: string) {
  doLogThings('launching browser');
  const browser = await puppetMaster.launch();

  doLogThings('creating new browser page');
  const page = await browser.newPage();

  doLogThings('browser navigating');
  await page.goto(url);

  doLogThings('fetching page content');
  const pageOfThingsAndStuff = await page.content();

  doLogThings('parsing page content');
  const $ = cheerioLad.load(pageOfThingsAndStuff);

  doLogThings('Finding element');
  const elementOfSurprise = $('.stats .workers .card-body .inactive');
  doLogThings('Amount of inactive workers:');

  console.log(elementOfSurprise.text());

  doLogThings('closing browser');
  await browser.close();
}

yargs(hideBin(process.argv))
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .command(
    'get <url>',
    'get the worker status from <url>',
    (yargs) => yargs.positional('url', { describe: 'url to get status from' }),
    async (argv) => {
      loggingEnabled = argv.verbose ?? false;
      await castThyStatusUponYe(argv.url as string);
    },
  )
  .argv;
