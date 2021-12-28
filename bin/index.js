#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'node:os';
import axios from 'axios';
import { program } from 'commander';
import Tondo from './tondo.js';

const parseOptions = () =>
  program
    .version('0.1.5')
    .description('Tondo')
    .option(
      '--orientation <orientation>',
      ['landscape', 'portrait', 'squarish'],
      'landscape'
    )
    //  .option('-l, --list', 'Just print images information')
    .option(
      '-d, --download',
      'Just download multiple images (Do not set desktop background)'
    )
    .option(
      '-o, --output <folder>',
      'Select output folder when -d is specified'
    )
    .option('--count <size>', 'Number of results (When download)', 10)
    .argument('[query]', 'Query', '')
    .action(main);

async function main(query, { count, download = false, orientation, output }) {
  const dataFolder = output
    ? resolve(process.cwd(), output)
    : resolve(os.homedir(), 'Pictures/Tondo/');
  const { downloadAllToFolder, setRandomBackground } = Tondo(axios);

  mkdirSync(dataFolder, { recursive: true });

  console.log('Querying Unsplash (https://unsplash.com)...');
  console.log(`* Query: '${query}'`);
  console.log(`* Orientation: '${orientation}'`);
  console.log(`* Images count: '${count}'`);
  console.log(`* Output folder: ${dataFolder}\n`);

  if (download) {
    await downloadAllToFolder(
      {
        orientation,
        query,
        count,
      },
      dataFolder
    );
  } else {
    await setRandomBackground(dataFolder, query, orientation).catch(error => {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            console.error(`No result found for '${query}'`);
            break;
          default:
            console.error(`${error.message} - ${error.config.url}`);
        }
      } else {
        console.error(error);
      }
    });
  }
}

// Main
(() => parseOptions().parseAsync())();
