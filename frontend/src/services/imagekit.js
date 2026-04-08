import api from './api';

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

export const uploadToImageKit = async ({ file, fileName, folder }) => {
  const authResponse = await api.get('/uploads/imagekit-auth');
  const { signature, token, expire, publicKey } = authResponse.data;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName || file.name);
  formData.append('publicKey', publicKey);
  formData.append('signature', signature);
  formData.append('token', token);
  formData.append('expire', expire);
  if (folder) {
    formData.append('folder', folder);
  }

  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
};
