import { resolve } from 'node:path';
import Tondo from '../bin/tondo.js';
import { randomPicture, randomPictures } from './unsplashMocks.mjs';

const tondoMock = data => {
  const downloadService = jasmine
    .createSpy()
    .and.returnValue(Promise.resolve('./file.jpg'));
  const setWallpaper = jasmine.createSpy();
  const wallpaperService = () => Promise.resolve({ setWallpaper });
  const log = jasmine.createSpy();
  const axios = {
    get: jasmine.createSpy().and.returnValue(Promise.resolve({ data })),
  };

  return {
    tondo: Tondo(
      axios,
      'CLIENT_ID_TEST',
      wallpaperService,
      downloadService,
      log
    ),
    axios,
    log,
    setWallpaper,
    downloadService,
  };
};

describe('Tondo', () => {
  it('should call setWallpaper', async () => {
    const { axios, tondo, downloadService, setWallpaper, log } =
      tondoMock(randomPicture);
    await tondo.setRandomBackground('./', 'cat', 'portrait');

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.unsplash.com/photos/random',
      {
        params: {
          client_id: 'CLIENT_ID_TEST',
          orientation: 'portrait',
          query: 'cat',
        },
      }
    );

    expect(downloadService).toHaveBeenCalledWith(
      jasmine.anything(),
      randomPicture,
      resolve('./', 'Dwu85P9SOIk.jpg'),
      'CLIENT_ID_TEST'
    );
    expect(setWallpaper).toHaveBeenCalledWith('./file.jpg');
    expect(log).toHaveBeenCalled();
  });

  it('should call downloadAllToFolder', async () => {
    const { axios, tondo, downloadService, log } = tondoMock(randomPictures);

    await tondo.downloadAllToFolder(
      {
        orientation: 'portrait',
        query: 'cat',
        count: 2,
      },
      './'
    );

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.unsplash.com/photos/random',
      {
        params: {
          client_id: 'CLIENT_ID_TEST',
          orientation: 'portrait',
          query: 'cat',
          count: 2,
        },
      }
    );

    expect(downloadService).toHaveBeenCalledWith(
      jasmine.anything(),
      randomPictures[0],
      resolve('./', 'Dwu85P9SOIk.jpg'),
      'CLIENT_ID_TEST'
    );
    expect(downloadService).toHaveBeenCalledWith(
      jasmine.anything(),
      randomPictures[1],
      resolve('./', 'Mwu55P9SOIk.jpg'),
      'CLIENT_ID_TEST'
    );
    expect(downloadService).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledTimes(2);
  });
});
