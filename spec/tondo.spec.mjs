import Tondo from '../bin/tondo.js';
import {randomPicture, randomPictures} from './usplashMocks.mjs'
import { resolve } from 'path';


describe("Player", function () {
  it("should call setWallpaper", async function () {

    const downloadService = jasmine.createSpy().and.returnValue(Promise.resolve('./file.jpg'));
    const setWallpaper = { setWallpaper: jasmine.createSpy() };
    const wallpaperService = () => Promise.resolve(setWallpaper);
    const log = jasmine.createSpy();
    const axios = { get: jasmine.createSpy().and.returnValue(Promise.resolve({ data: randomPicture })) }

    const tondoInstance = Tondo(axios, 'CLIENT_ID_TEST', wallpaperService, downloadService, log)
    const t = await tondoInstance.setRandomBackground("./", 'cat', 'portrait')

    expect(axios.get).toHaveBeenCalledWith('https://api.unsplash.com/photos/random',
      { params: { client_id: 'CLIENT_ID_TEST', orientation: 'portrait', query: 'cat', } });

    expect(downloadService).toHaveBeenCalledWith(axios, randomPicture, resolve('./', 'Dwu85P9SOIk.jpg'), 'CLIENT_ID_TEST');
    expect(setWallpaper.setWallpaper).toHaveBeenCalledWith('./file.jpg');
    expect(log).toHaveBeenCalled();
  });

  it("should call downloadAllToFolder", async function () {
    const downloadService = jasmine.createSpy().and.returnValue(Promise.resolve('./file.jpg'));
    const setWallpaper = { setWallpaper: jasmine.createSpy() };
    const wallpaperService = () => Promise.resolve(setWallpaper);
    const log = jasmine.createSpy();
    const axios = { get: jasmine.createSpy().and.returnValue(Promise.resolve({ data: randomPictures })) }

    const tondoInstance = Tondo(axios, 'CLIENT_ID_TEST', wallpaperService, downloadService, log)
    const t = await tondoInstance.downloadAllToFolder({
      orientation: 'portrait',
      query: 'cat',
      count: 2
    }, './');

    expect(axios.get).toHaveBeenCalledWith('https://api.unsplash.com/photos/random',
      { params: { client_id: 'CLIENT_ID_TEST', orientation: 'portrait', query: 'cat', count: 2 } });

    expect(downloadService).toHaveBeenCalledWith(axios, randomPictures[0], resolve('./', 'Dwu85P9SOIk.jpg'), 'CLIENT_ID_TEST');
    expect(downloadService).toHaveBeenCalledWith(axios, randomPictures[1], resolve('./', 'Mwu55P9SOIk.jpg'), 'CLIENT_ID_TEST');

    expect(log).toHaveBeenCalledTimes(2);
  });
});
