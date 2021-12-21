
import axios from 'axios';
import { existsSync, createWriteStream } from 'fs';
import { resolve } from 'path';

const client_id = 'db4d69677b2838dfc4f9ef73ee79dcde8412472617bc96adefde321bd08a76f2';

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

const downloadAllToFolder = (params, folder) => getImageMetadata(params)
    .then(downloadAsyncToFolder(folder))

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

async function setRandomBackground(basePath, query, orientation) {
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

export { downloadAllToFolder, setRandomBackground };