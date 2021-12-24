#!/usr/bin/env node
import { mkdirSync } from 'fs';
import { program } from 'commander';
import { downloadAllToFolder, setRandomBackground } from './tondo.js';

const parseOptions = () => program
    .version('0.1.4')
    .description('Tondo')
    .option('--orientation <orientation>', ['landscape', 'portrait', 'squarish'], 'landscape')
//  .option('-l, --list', 'Just print images information')
    .option('-d, --download', 'Just download multiple images (Do not set desktop background)')
    .option('--count <size>', 'Number of results (When download)', 10)
    .argument('[query]', 'Query', '')
    .action(main);

async function main(query, { count, download = false, list = false, orientation }) {
    console.log('\x1b[33mTonding...\x1b[0m');

    const envPaths = await import('env-paths');
    const { data: dataFolder } = envPaths.default('tondo');
    mkdirSync(dataFolder, { recursive: true });

    if (download) {
        await downloadAllToFolder({
            client_id,
            orientation,
            query,
            count
        }, dataFolder
        ).then(results => results.forEach(result => console.log(result.value)))

    } else {
        await setRandomBackground(dataFolder, query).catch(err => {
            if (err.response) {
                switch (err.response.status) {
                    case 404:
                        console.error(`No result found for '${query}'`);
                        break;
                    default:
                        console.error(`${err.message} - ${err.config.url}`);
                }
            } else {
                console.error(`${err.message} - ${err.config.url}`);
            }
        });
    }
}

// Main
(async () => await parseOptions().parseAsync())();