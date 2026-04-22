import { useState, useEffect } from 'react';
import { getCategoriesAPI } from '../services/adminService';

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategoriesAPI();
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, fetchCategories };
};

export default useCategories;