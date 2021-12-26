#!/usr/bin/env node
import axios from 'axios';
import { mkdirSync } from 'fs';
import { program } from 'commander';
import Tondo from './tondo.js';

const parseOptions = () => program
    .version('0.1.5')
    .description('Tondo')
    .option('--orientation <orientation>', ['landscape', 'portrait', 'squarish'], 'landscape')
    //  .option('-l, --list', 'Just print images information')
    .option('-d, --download', 'Just download multiple images (Do not set desktop background)')
    .option('--count <size>', 'Number of results (When download)', 10)
    .argument('[query]', 'Query', '')
    .action(main);

async function main(query, { count, download = false, list = false, orientation }) {
    const envPaths = await import('env-paths');
    const { data: dataFolder } = envPaths.default('tondo');
    const { downloadAllToFolder, setRandomBackground } = Tondo(axios);

    mkdirSync(dataFolder, { recursive: true });

    console.log('Querying Unsplash (https://unsplash.com)...\n');

    if (download) {
        await downloadAllToFolder({
            orientation,
            query,
            count
        }, dataFolder)
    } else {
        await setRandomBackground(dataFolder, query, orientation).catch(err => {
            if (err.response) {
                switch (err.response.status) {
                    case 404:
                        console.error(`No result found for '${query}'`);
                        break;
                    default:
                        console.error(`${err.message} - ${err.config.url}`);
                }
            } else {
                console.error(err);
            }
        });
    }
}

// Main
(async () => await parseOptions().parseAsync())();