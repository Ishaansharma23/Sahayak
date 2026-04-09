import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const uploadFile = async ({ file, category }) => {
  if (!file) {
    throw new Error('File is required');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_URL}/uploads/${category}`, formData, {
    withCredentials: true,
  });

  return response.data;
};
