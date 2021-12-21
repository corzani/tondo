#!/usr/bin/env node

const axios = require('axios');
const { program } = require('commander');
const { existsSync, createWriteStream, mkdirSync } = require('fs');
const { resolve } = require('path');

const client_id = 'db4d69677b2838dfc4f9ef73ee79dcde8412472617bc96adefde321bd08a76f2';
const orientation = 'landscape';

const downloadAllImagesToFolder = toFolder => images => Promise.allSettled(images.map(photo => downloadIfNotExist(toFolder, photo)));

// params
//
// {
//     client_id,
//     orientation,
//     query,
//     page,
//     per_page
// }
const searchPhotos = (params) => axios.get('https://api.unsplash.com/search/photos', { params })
    .then(res => res.data.results)

function downloadIfNotExist(basePath, photo) {
    const { id } = photo;
    const path = resolve(basePath, `${id}.jpg`);

    const exsist = existsSync(path);
    return (exsist) ? Promise.resolve(path) : download(photo, path);
}

async function download(photo, path) {
    const { id, links } = photo;
    const writer = createWriteStream(path);
    const imageStream = await axios.get(links.download, {
        params: {
            client_id
        },
        responseType: 'stream'
    })

    const result = new Promise((resolve, reject) => {
        writer.on('finish', resolve(path));
        writer.on('error', reject(`Unable to download '${id}' => '${links.download}'`));
    });

    imageStream.data.pipe(writer);
    return result;
}

function getRandomImages({ client_id, orientation, query }, count) {
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
    const randomImage = await getRandomImages({
        client_id,
        orientation,
        query
    })
    return downloadIfNotExist(basePath, randomImage.data)
        .then(setWallpaper);
}

function getImageMetadata({ client_id, orientation, query, count }) {
        return getRandomImages({ client_id, orientation, query }, count).then(res => res.data);
}


async function main(query, {count, download = false}) {
    console.log('\x1b[33mTonding...\x1b[0m');

    const envPaths = await import('env-paths');
    const { data } = envPaths.default('tondo');
    mkdirSync(data, { recursive: true });

    if (download) {
        await getImageMetadata({
            client_id,
            orientation,
            query,
            count
        })
            .then(downloadAllImagesToFolder(data))
            .then(results => results.forEach(result => console.log(result.value)))
            .catch(err => console.error(`${err.message} - ${err.config.url}`));
    } else {
        await setRandomBackground(data, query).catch(err => {
            switch (err.response.status) {
                case 404:
                    console.error(`No result found for '${query}'`);
                    break;
                default:
                    console.error(`${err.message} - ${err.config.url}`);
            }
        });
    }
}

(async () => {
    program
        .version('0.1.2')
        .description('Tondo')
        .option('-d, --download', 'Just download multiple images (Do not set desktop background)')
        .option('--count <size>', 'Number of results (When download)', 10)
        .argument('[query]', 'Query', '')
        .action(main);

    await program.parseAsync();
})();