import api from './api.js';



export const getCollectionByIdAPI = async (id) => {
  return api.get(`/collections/${id}`);
};