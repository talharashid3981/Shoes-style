// src/services/newsletter.service.js
import api from "./api";

// Subscribe to newsletter
export const subscribeAPI = async (email, name, preferences = []) => {
  const response = await api.post("/newsletter/subscribe", {
    email,
    name,
    preferences,
  });
  return response;
};

// Verify subscription
export const verifySubscriptionAPI = async (token) => {
  const response = await api.get(`/newsletter/verify/${token}`);
  return response;
};

// Unsubscribe
export const unsubscribeAPI = async (email) => {
  const response = await api.post("/newsletter/unsubscribe", { email });
  return response;
};



// Create campaign (admin)
export const createCampaignAPI = async (data) => {
  const response = await api.post("/newsletter/campaigns", data);
  return response;
};



// Update newsletter preferences (logged in user)
export const updatePreferencesAPI = async (data) => {
  const response = await api.put("/users/newsletter", data);
  return response;
};