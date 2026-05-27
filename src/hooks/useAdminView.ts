import { useLocation } from 'react-router-dom';
import { getOrders, getMaterials, getCashRegisters, getMaterialCategories } from '@/utils/supabaseStorage';
import { getOrdersForUser, getMaterialsForUser, getCashRegistersForUser } from '@/utils/adminDataAccess';

/**
 * Hook to access admin view state from location.state
 * This allows pages to check if they're being viewed as another user by an admin
 */
export function useAdminViewState() {
  const location = useLocation();
  
  const adminViewingUser = location.state?.adminViewingUser as string | undefined;
  const adminViewingUserName = location.state?.adminViewingUserName as string | undefined;
  const isAdminView = !!adminViewingUser;

  return {
    isAdminView,
    adminViewingUser,
    adminViewingUserName
  };
}

/**
 * Hook to load data with admin view support
 * Automatically uses admin data access functions when in admin view mode
 */
export function useAdminDataLoader() {
  const { isAdminView, adminViewingUser } = useAdminViewState();

  const loadOrders = async () => {
    if (isAdminView && adminViewingUser) {
      return getOrdersForUser(adminViewingUser);
    }
    return getOrders();
  };

  const loadMaterials = async () => {
    if (isAdminView && adminViewingUser) {
      return getMaterialsForUser(adminViewingUser);
    }
    return getMaterials();
  };

  const loadCashRegisters = async () => {
    if (isAdminView && adminViewingUser) {
      return getCashRegistersForUser(adminViewingUser);
    }
    return getCashRegisters();
  };

  const loadMaterialCategories = async () => {
    // Categories are shared across users, no admin override needed
    return getMaterialCategories();
  };

  return {
    isAdminView,
    adminViewingUser,
    loadOrders,
    loadMaterials,
    loadCashRegisters,
    loadMaterialCategories
  };
}
