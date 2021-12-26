import { existsSync, createWriteStream } from 'fs';
import { resolve } from 'path';

const default_client_id = 'db4d69677b2838dfc4f9ef73ee79dcde8412472617bc96adefde321bd08a76f2';
const defaultWallpaperService = async () => await import('wallpaper');

async function download(axios, photo, path, client_id) {
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

export default (axios, client_id = default_client_id,
    wallpaperService = defaultWallpaperService, downloadService = download, log = console.log) => {

    function downloadAllToFolder(params, folder) {
        return getImagesMetadata(params)
            .then(downloadAsyncToFolder(folder))
    }

    function downloadIfNotExist(basePath, photo) {
        const { id } = photo;
        const path = resolve(basePath, `${id}.jpg`);

        const exsist = existsSync(path);
        return (exsist) ? Promise.resolve(path) : downloadService(axios, photo, path, client_id);
    }

    function getRandomImages({ orientation, query }, count) {
        const localParams = {
            client_id,
            orientation,
            query
        };

        const params = (count > 1) ? { ...localParams, count } : localParams;
        return axios.get('https://api.unsplash.com/photos/random', { params });
    }

    function downloadAsyncToFolder(toFolder) {
        return images => Promise.allSettled(images.map(photo => downloadIfNotExist(toFolder, photo).then(data => logImageInfo(photo)(data))));
    }

    function logImageInfo({ links, user }) {
        const logIfExists = (finalString, [key, value]) => (value !== undefined && value !== null) ? finalString + `${key} : ${value}\n` : finalString;
        return path => {

            // Awful style logging... Avoid Async messages

            log(
                [
                    ['Name      ', user.name],
                    ['Username  ', user.username],
                    ['Location  ', user.location],
                    ['Instagram ', user.instagram_username],
                    ['Twitter   ', user.twitter_username],
                    ['Image     ', links.html],
                    ['Downloaded', path]
                ].reduce(logIfExists, '')
            );

            return path;
        };
    }

    async function setRandomBackground(basePath, query, orientation) {
        const { setWallpaper } = await wallpaperService();
        const data = await getImagesMetadata({
            orientation,
            query
        });

        return downloadIfNotExist(basePath, data)
            .then(logImageInfo(data))
            .then(setWallpaper);
    }

    function getImagesMetadata({ orientation, query, count }) {
        return getRandomImages({ orientation, query }, count).then(res => res.data);
    }

    return ({ setRandomBackground, downloadAllToFolder, getImagesMetadata })
}
