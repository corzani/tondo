const Tondo = require('./tondo');
const axios = require('axios');

describe('Tondo', () => {
    test('Random Background', () => {

        jest.mock('axios');

        const setWallpaper = jest.fn();
        const downloadService = jest.fn();

        const wallpaperService = () => Promise.resolve({
            setWallpaper
        })

        const tondoInstance = Tondo(axios, 'CLIENT_ID_TEST', setWallpaper, downloadService)

        tondoInstance.getImagesMetadata({ orientation: 'landscape', query: '', count: 2 })
    })
});