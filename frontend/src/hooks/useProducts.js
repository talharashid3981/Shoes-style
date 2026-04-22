import { useDispatch, useSelector } from "react-redux";
import { setProducts, setCurrentProduct, setRelatedProducts, setLoading, setError, clearCurrentProduct } from "../store/slices/productSlice";
import { getProductsAPI,getProductByIdAPI ,getRelatedProductsAPI} from "../services/productService";

const useProducts = () => {
  const dispatch = useDispatch();
  const { products, currentProduct, relatedProducts, total, page, pages, isLoading } = useSelector((state) => state.products);

  const fetchProducts = async (params = {}) => {
    dispatch(setLoading(true));
    try {
      const response = await getProductsAPI(params);
      if (response.success) {
        dispatch(setProducts(response));
      }
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  const fetchProductById = async (id) => {
    dispatch(setLoading(true));
    try {
      const response = await getProductByIdAPI(id);
      if (response.success) {
        dispatch(setCurrentProduct(response.product));
        return response.product;
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const fetchRelatedProducts = async (id) => {
    try {
      const response = await getRelatedProductsAPI(id);
      if (response.success) {
        dispatch(setRelatedProducts(response.products));
      }
    } catch (error) {
      console.error("Failed to fetch related products:", error);
    }
  };

  const clearProduct = () => {
    dispatch(clearCurrentProduct());
  };

  return {
    products,
    currentProduct,
    relatedProducts,
    total,
    page,
    pages,
    isLoading,
    fetchProducts,
    fetchProductById,
    fetchRelatedProducts,
    clearProduct,
  };
};

export default useProducts;