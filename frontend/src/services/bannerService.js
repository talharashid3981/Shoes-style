import api from './api.js';

export const getActiveBannersAPI = async () => {
  return api.get('/banners');
};