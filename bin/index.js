#!/usr/bin/env node

const axios = require('axios');
const { program } = require('commander');
const { existsSync, createWriteStream, mkdirSync } = require('fs');
const { resolve } = require('path');

const client_id = 'db4d69677b2838dfc4f9ef73ee79dcde8412472617bc96adefde321bd08a76f2';
const orientation = 'landscape';

async function downloadIfNotExist(basePath, photo) {
    const { id } = photo;
    const path = resolve(basePath, `${id}.jpg`);

    const exsist = existsSync(path);
    return (exsist) ? Promise.resolve(path) : download(photo, path);
}

async function download(photo, path) {
    const { id, links } = photo;
    const writer = createWriteStream(path);
    return axios.get(links.download, {
        params: {
            client_id
        },
        responseType: 'stream'
    }).then(res => {
        const result = new Promise((resolve, reject) => {
            writer.on('finish', resolve(path));
            writer.on('error', reject(`Unable to download '${id}' => '${links.download}'`));
        });
        res.data.pipe(writer);
        return result;
    }, err => reject(path));
}

function getRandomImages({ client_id, orientation, query }, count = 1) {
    const localParams = {
        client_id,
        orientation,
        query
    }

    const params = (count > 1) ? { ...localParams, count } : localParams

    return axios.get('https://api.unsplash.com/photos/random', { params })
}

async function setRandomBackground(basePath, query) {
    const { setWallpaper } = await import('wallpaper')
    await getRandomImages({
        client_id,
        orientation,
        query
    }).then(res => {
        return downloadIfNotExist(basePath, res.data).then(setWallpaper)
    }, err => {
        switch (err.response.status) {
            case 404:
                console.error(`No result found for '${query}'`);
                break;
            default:
                console.dir(err);
                console.error(`${err.message} - ${err.config.url}`);
        }
    });
}

function getImageMetadata({ client_id, orientation, query, page, per_page }, random = false) {
    if (random) {
        return getRandomImages({ client_id, orientation, query }, per_page).then(res => res.data);
    } else {
        return axios.get('https://api.unsplash.com/search/photos', {
            params: {
                client_id,
                orientation,
                query,
                page,
                per_page
            }
        }).then(res => res.data.results)
    }
}

async function main(query, { page = 1, per_page = 10, download = false, random = false }) {
    console.log('\x1b[33mTonding...\x1b[0m');

    const envPaths = await import('env-paths');
    const { data } = envPaths.default('tondo');
    mkdirSync(data, { recursive: true });

    if (download) {
        await getImageMetadata({
            client_id,
            orientation,
            query,
            page,
            per_page
        }, random)
            // .then(res => console.dir(res.data))
            .then(images => Promise.allSettled(images.map(photo => downloadIfNotExist(data, photo)))
                .then(results => results.forEach(result => console.log(result.value))), err => {
                    console.error(`${err.message} - ${err.config.url}`)
                });
    } else {
        await setRandomBackground(data, query);
    }
}

(async () => {
    program
        .version('0.1.0')
        .description('Tondo')
        .option('-d, --download', 'Just download multiple images (Do not set desktop background)')
        .option('-r, --random', 'Take random image(s)')
        .option('-p, --page', 'Page')
        .option('--per_page <size>', 'Page Size')
        .argument('[query]', 'Query', '')
        .action(main);

    await program.parseAsync();
})();