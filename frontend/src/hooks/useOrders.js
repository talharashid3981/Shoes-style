import { useDispatch, useSelector } from "react-redux";
import { setOrders, setCurrentOrder, setLoading, setError, clearCurrentOrder } from "../store/slices/orderSlice";
import { getMyOrdersAPI ,getOrderByIdAPI} from "../services/orderService";

const useOrders = () => {
  const dispatch = useDispatch();
  const { orders, currentOrder, total, page, pages, isLoading } = useSelector((state) => state.orders);

  const fetchMyOrders = async (params = {}) => {
    dispatch(setLoading(true));
    try {
      const response = await getMyOrdersAPI(params);
      if (response.success) {
        dispatch(setOrders(response));
      }
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  const fetchOrderById = async (id, email = null) => {
    dispatch(setLoading(true));
    try {
      const response = await getOrderByIdAPI(id, email);
      if (response.success) {
        dispatch(setCurrentOrder(response.order));
        return response.order;
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const cancelOrder = async (id) => {
    dispatch(setLoading(true));
    try {
      const response = await orderService.cancelOrder(id);
      if (response.success) {
        await fetchMyOrders();
        return response;
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  };

  const clearOrder = () => {
    dispatch(clearCurrentOrder());
  };

  return {
    orders,
    currentOrder,
    total,
    page,
    pages,
    isLoading,
    fetchMyOrders,
    fetchOrderById,
    cancelOrder,
    clearOrder,
  };
};

export default useOrders;