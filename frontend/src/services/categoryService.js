import api from './api.js';


export const getCategoryByIdAPI = async (id) => {
  return api.get(`/categories/${id}`);
};