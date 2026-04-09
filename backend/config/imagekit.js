const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const isImageKitConfigured = () => Boolean(
  process.env.IMAGEKIT_PUBLIC_KEY
  && process.env.IMAGEKIT_PRIVATE_KEY
  && process.env.IMAGEKIT_URL_ENDPOINT
);

module.exports = {
  imagekit,
  isImageKitConfigured,
};
