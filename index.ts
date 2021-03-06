#!/usr/bin/env node
import cheerioLad from 'cheerio';
import puppetMaster from 'puppeteer';
import { URL } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface BadNews {
  messages: string[];
  addConsiderations?: boolean;
  exitCode?: number;
}

let loggingEnabled = true;
let scriptPath: string = '';
let setExitCode: boolean;
let url: URL;

function doLogThings(message: string) {
  if (loggingEnabled) {
    console.log('[VERBOSE]', message);
  }
}

function breakSomeBadNews({ messages, addConsiderations = false, exitCode = 1 }: BadNews) {
  const thingsToTry = '\nPotential issues to consider:' +
    `\n\t- Is the URL "${url.href}" correct?` +
    '\n\t- Is the website expirencing issues?' +
    '\n\t- Has the element selector changed?';

  console.error(
    '\x1b[31m[ERROR]', // Make output red
    ...messages,
    addConsiderations ? thingsToTry : '',
    '\x1b[0m', // Reset terminal colour
  );

  process.exit(exitCode);
}

async function castThyStatusUponYe(selector: string) {
  doLogThings('Launching browser');
  const browser = await puppetMaster.launch();

  doLogThings('Creating new browser page');
  const page = await browser.newPage();

  page.on('requestfailed', async (error) => {
    breakSomeBadNews({
      messages: [
        `Failure when trying to navigate to: ${url.href}.`,
        `\nThe following error description may give a clue as to what when wrong: `,
        error._failureText,
      ]
    });
  });

  page.on('response', (response) => {
    if (response.status() < 200 || response.status() > 300) {
      breakSomeBadNews({
        messages: [`The request returned a non-success status of "${response.status()}: ${response.statusText()}"`],
      });
    }
  });

  doLogThings('Browser navigating');
  await page.goto(url.href);

  doLogThings('Fetching page content');
  const pageContent = await page.content();

  doLogThings('Closing browser');
  await browser.close();

  doLogThings('Parsing page content');
  const $ = cheerioLad.load(pageContent);

  doLogThings('Finding element');
  const element = $(selector);

  if (element.length !== 1) {
    breakSomeBadNews({ messages: ['Couldn\'t find the element'], addConsiderations: true });
  }

  doLogThings('Found an element');
  doLogThings('Parsing content as a number');

  const numberOfInactiveWorkers = Number.parseInt(element.text());

  if (isNaN(numberOfInactiveWorkers)) {
    breakSomeBadNews({ messages: ['Couldn\'t parse a number'], addConsiderations: true });
  }

  // Print the count
  doLogThings('Amount of inactive workers:');
  console.log(numberOfInactiveWorkers);

  if (setExitCode && numberOfInactiveWorkers !== 0) {
    process.exit(1);
  }

  process.exit(0);
}

yargs(hideBin(process.argv))
  .version()
  .usage('Usage: $0 <url> [options]')
  .option('exit-code', {
    alias: 'e',
    type: 'boolean',
    description: 'Set exit code to 1 if the number of inactive workers is more than 0',
  })
  .option('selector', {
    alias: 's',
    type: 'string',
    description: 'The selector used to find the element on the page',
    default: '.stats .workers .card-body .inactive',
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  })
  .command(
    '$0 <url>',
    'get the worker status from <url>',
    (yargs) => yargs.positional(
      '<url>',
      { description: 'Used to get the worker status from' },
    ).wrap(yargs.terminalWidth()),
    async (argv) => {
      loggingEnabled = argv.verbose ?? false;
      scriptPath = argv.$0;
      const rawUrl = (argv.url as string) ?? null;

      if (!rawUrl || rawUrl.length === 0) {
        breakSomeBadNews({
          messages: [`Did not get anything to work with. Try running: \n$ ${scriptPath} --help\n`],
          exitCode: 22
        });
      }

      try {
        if (rawUrl.startsWith('http')) {
          url = new URL(rawUrl);
        } else {
          url = new URL('http://' + rawUrl);
        }
      } catch (error) {
        breakSomeBadNews({ messages: [`"${rawUrl}" is not a vaild URL!`] });
      }

      const selector: string = argv.selector;

      await castThyStatusUponYe(selector);
    },
  )
  .argv;
