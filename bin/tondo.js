
import axios from 'axios';
import { existsSync, createWriteStream } from 'fs';
import { resolve } from 'path';

const default_client_id = 'db4d69677b2838dfc4f9ef73ee79dcde8412472617bc96adefde321bd08a76f2';

const downloadAsyncToFolder = (toFolder, client_id) => images =>
    Promise.allSettled(images.map(photo => downloadIfNotExist(toFolder, photo, client_id).then(data => logImageInfo(photo)(data))));

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

function downloadAllToFolder(params, folder, client_id = default_client_id) {
    return getImagesMetadata(params, client_id)
        .then(downloadAsyncToFolder(folder, client_id))
}

function downloadIfNotExist(basePath, photo, client_id = default_client_id) {
    const { id } = photo;
    const path = resolve(basePath, `${id}.jpg`);

    const exsist = existsSync(path);
    return (exsist) ? Promise.resolve(path) : download(photo, path, client_id);
}

async function download(photo, path, client_id = default_client_id) {
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

function getRandomImages({ orientation, query }, count, client_id = default_client_id) {
    const localParams = {
        client_id,
        orientation,
        query
    };

    const params = (count > 1) ? { ...localParams, count } : localParams;
    return axios.get('https://api.unsplash.com/photos/random', { params });
}

const logImageInfo = ({ links, user, urls }, log = console.log) => path => {

    // Awful style logging... Avoid Async messages

    const logIfExists = ([key, value]) => (value !== undefined && value !== null) ? `\t${key} : ${value}\n` : '';

    let logMessage = "Author\n"
    logMessage += [
        ['Name', user.name],
        ['Username', user.username],
        ['Location', user.location],
        ['Instagram', user.instagram_username],
        ['Twitter', user.twitter_username]
    ].map(logIfExists).join('');
    logMessage += 'Links\n';
    logMessage += `\tImage : ${links.html}\n`;
    logMessage += `\tDownloaded location : ${path}\n`;
    logMessage += '-------------------';

    log(logMessage);

    return path;
}

async function setRandomBackground(basePath, query, orientation, client_id = default_client_id) {
    const { setWallpaper } = await import('wallpaper')
    const data = await getImagesMetadata({
        orientation,
        query
    }, client_id)
    return downloadIfNotExist(basePath, data)
        .then(logImageInfo(data))
        .then(setWallpaper);
}

function getImagesMetadata({ orientation, query, count }, client_id = default_client_id) {
    return getRandomImages({ orientation, query }, count, client_id).then(res => res.data);
}

export { downloadAllToFolder, setRandomBackground };