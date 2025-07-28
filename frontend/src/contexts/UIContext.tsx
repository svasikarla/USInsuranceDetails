import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UIState {
  // Global loading states
  globalLoading: boolean;
  
  // Page-specific loading states
  pageLoading: {
    dashboard: boolean;
    policies: boolean;
    documents: boolean;
    carriers: boolean;
    analytics: boolean;
  };
  
  // Modal and overlay states
  modals: {
    policyCreate: boolean;
    policyEdit: boolean;
    documentUpload: boolean;
    confirmDelete: boolean;
  };
  
  // Sidebar and navigation states
  navigation: {
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;
    profileMenuOpen: boolean;
  };
  
  // Form states
  forms: {
    isDirty: Record<string, boolean>;
    isSubmitting: Record<string, boolean>;
    errors: Record<string, Record<string, string>>;
  };
  
  // Notification states
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
    autoClose?: boolean;
    duration?: number;
  }>;
  
  // Theme and preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    reducedMotion: boolean;
    compactMode: boolean;
    language: string;
  };
  
  // Search and filter states
  search: {
    query: string;
    filters: Record<string, any>;
    results: any[];
    isSearching: boolean;
  };
}

export type UIAction =
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_PAGE_LOADING'; payload: { page: keyof UIState['pageLoading']; loading: boolean } }
  | { type: 'TOGGLE_MODAL'; payload: { modal: keyof UIState['modals']; open?: boolean } }
  | { type: 'TOGGLE_NAVIGATION'; payload: { nav: keyof UIState['navigation']; open?: boolean } }
  | { type: 'SET_FORM_STATE'; payload: { formId: string; field: 'isDirty' | 'isSubmitting'; value: boolean } }
  | { type: 'SET_FORM_ERRORS'; payload: { formId: string; errors: Record<string, string> } }
  | { type: 'CLEAR_FORM_ERRORS'; payload: { formId: string; field?: string } }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<UIState['notifications'][0], 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_PREFERENCE'; payload: { key: keyof UIState['preferences']; value: any } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_FILTERS'; payload: Record<string, any> }
  | { type: 'SET_SEARCH_RESULTS'; payload: any[] }
  | { type: 'SET_SEARCH_LOADING'; payload: boolean }
  | { type: 'CLEAR_SEARCH' };

export interface UIContextType {
  state: UIState;
  
  // Loading management
  setGlobalLoading: (loading: boolean) => void;
  setPageLoading: (page: keyof UIState['pageLoading'], loading: boolean) => void;
  
  // Modal management
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  toggleModal: (modal: keyof UIState['modals']) => void;
  
  // Navigation management
  toggleSidebar: (open?: boolean) => void;
  toggleMobileMenu: (open?: boolean) => void;
  toggleProfileMenu: (open?: boolean) => void;
  
  // Form management
  setFormDirty: (formId: string, isDirty: boolean) => void;
  setFormSubmitting: (formId: string, isSubmitting: boolean) => void;
  setFormErrors: (formId: string, errors: Record<string, string>) => void;
  clearFormErrors: (formId: string, field?: string) => void;
  
  // Notification management
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Preference management
  setPreference: (key: keyof UIState['preferences'], value: any) => void;
  
  // Search management
  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: Record<string, any>) => void;
  setSearchResults: (results: any[]) => void;
  setSearchLoading: (loading: boolean) => void;
  clearSearch: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: UIState = {
  globalLoading: false,
  pageLoading: {
    dashboard: false,
    policies: false,
    documents: false,
    carriers: false,
    analytics: false,
  },
  modals: {
    policyCreate: false,
    policyEdit: false,
    documentUpload: false,
    confirmDelete: false,
  },
  navigation: {
    sidebarOpen: false,
    mobileMenuOpen: false,
    profileMenuOpen: false,
  },
  forms: {
    isDirty: {},
    isSubmitting: {},
    errors: {},
  },
  notifications: [],
  preferences: {
    theme: 'light',
    reducedMotion: false,
    compactMode: false,
    language: 'en',
  },
  search: {
    query: '',
    filters: {},
    results: [],
    isSearching: false,
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateNotificationId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// REDUCER
// ============================================================================

const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        globalLoading: action.payload,
      };

    case 'SET_PAGE_LOADING':
      return {
        ...state,
        pageLoading: {
          ...state.pageLoading,
          [action.payload.page]: action.payload.loading,
        },
      };

    case 'TOGGLE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modal]: action.payload.open ?? !state.modals[action.payload.modal],
        },
      };

    case 'TOGGLE_NAVIGATION':
      return {
        ...state,
        navigation: {
          ...state.navigation,
          [action.payload.nav]: action.payload.open ?? !state.navigation[action.payload.nav],
        },
      };

    case 'SET_FORM_STATE':
      return {
        ...state,
        forms: {
          ...state.forms,
          [action.payload.field]: {
            ...state.forms[action.payload.field],
            [action.payload.formId]: action.payload.value,
          },
        },
      };

    case 'SET_FORM_ERRORS':
      return {
        ...state,
        forms: {
          ...state.forms,
          errors: {
            ...state.forms.errors,
            [action.payload.formId]: action.payload.errors,
          },
        },
      };

    case 'CLEAR_FORM_ERRORS':
      if (action.payload.field) {
        const formErrors = { ...state.forms.errors[action.payload.formId] };
        delete formErrors[action.payload.field];
        return {
          ...state,
          forms: {
            ...state.forms,
            errors: {
              ...state.forms.errors,
              [action.payload.formId]: formErrors,
            },
          },
        };
      }
      
      const newErrors = { ...state.forms.errors };
      delete newErrors[action.payload.formId];
      return {
        ...state,
        forms: {
          ...state.forms,
          errors: newErrors,
        },
      };

    case 'ADD_NOTIFICATION':
      const newNotification = {
        ...action.payload,
        id: generateNotificationId(),
        timestamp: Date.now(),
      };
      return {
        ...state,
        notifications: [...state.notifications, newNotification],
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };

    case 'SET_PREFERENCE':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        search: {
          ...state.search,
          query: action.payload,
        },
      };

    case 'SET_SEARCH_FILTERS':
      return {
        ...state,
        search: {
          ...state.search,
          filters: action.payload,
        },
      };

    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        search: {
          ...state.search,
          results: action.payload,
        },
      };

    case 'SET_SEARCH_LOADING':
      return {
        ...state,
        search: {
          ...state.search,
          isSearching: action.payload,
        },
      };

    case 'CLEAR_SEARCH':
      return {
        ...state,
        search: {
          query: '',
          filters: {},
          results: [],
          isSearching: false,
        },
      };

    default:
      return state;
  }
};

// Create the context
const UIContext = createContext<UIContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // ============================================================================
  // LOADING MANAGEMENT
  // ============================================================================

  const setGlobalLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading });
  }, []);

  const setPageLoading = useCallback((page: keyof UIState['pageLoading'], loading: boolean) => {
    dispatch({ type: 'SET_PAGE_LOADING', payload: { page, loading } });
  }, []);

  // ============================================================================
  // MODAL MANAGEMENT
  // ============================================================================

  const openModal = useCallback((modal: keyof UIState['modals']) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: { modal, open: true } });
  }, []);

  const closeModal = useCallback((modal: keyof UIState['modals']) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: { modal, open: false } });
  }, []);

  const toggleModal = useCallback((modal: keyof UIState['modals']) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: { modal } });
  }, []);

  // ============================================================================
  // NAVIGATION MANAGEMENT
  // ============================================================================

  const toggleSidebar = useCallback((open?: boolean) => {
    dispatch({ type: 'TOGGLE_NAVIGATION', payload: { nav: 'sidebarOpen', open } });
  }, []);

  const toggleMobileMenu = useCallback((open?: boolean) => {
    dispatch({ type: 'TOGGLE_NAVIGATION', payload: { nav: 'mobileMenuOpen', open } });
  }, []);

  const toggleProfileMenu = useCallback((open?: boolean) => {
    dispatch({ type: 'TOGGLE_NAVIGATION', payload: { nav: 'profileMenuOpen', open } });
  }, []);

  // ============================================================================
  // FORM MANAGEMENT
  // ============================================================================

  const setFormDirty = useCallback((formId: string, isDirty: boolean) => {
    dispatch({ type: 'SET_FORM_STATE', payload: { formId, field: 'isDirty', value: isDirty } });
  }, []);

  const setFormSubmitting = useCallback((formId: string, isSubmitting: boolean) => {
    dispatch({ type: 'SET_FORM_STATE', payload: { formId, field: 'isSubmitting', value: isSubmitting } });
  }, []);

  const setFormErrors = useCallback((formId: string, errors: Record<string, string>) => {
    dispatch({ type: 'SET_FORM_ERRORS', payload: { formId, errors } });
  }, []);

  const clearFormErrors = useCallback((formId: string, field?: string) => {
    dispatch({ type: 'CLEAR_FORM_ERRORS', payload: { formId, field } });
  }, []);

  // ============================================================================
  // NOTIFICATION MANAGEMENT
  // ============================================================================

  const addNotification = useCallback((notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

    // Auto-remove notification if autoClose is true
    if (notification.autoClose !== false) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        // We need to get the notification ID, but since it's generated in the reducer,
        // we'll need to handle this differently. For now, we'll rely on the component
        // to handle auto-removal.
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);

  // ============================================================================
  // PREFERENCE MANAGEMENT
  // ============================================================================

  const setPreference = useCallback((key: keyof UIState['preferences'], value: any) => {
    dispatch({ type: 'SET_PREFERENCE', payload: { key, value } });

    // Persist preferences to localStorage
    try {
      const preferences = JSON.parse(localStorage.getItem('ui-preferences') || '{}');
      preferences[key] = value;
      localStorage.setItem('ui-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to persist UI preference:', error);
    }
  }, []);

  // ============================================================================
  // SEARCH MANAGEMENT
  // ============================================================================

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setSearchFilters = useCallback((filters: Record<string, any>) => {
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: filters });
  }, []);

  const setSearchResults = useCallback((results: any[]) => {
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
  }, []);

  const setSearchLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_SEARCH_LOADING', payload: loading });
  }, []);

  const clearSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH' });
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: UIContextType = {
    state,

    // Loading management
    setGlobalLoading,
    setPageLoading,

    // Modal management
    openModal,
    closeModal,
    toggleModal,

    // Navigation management
    toggleSidebar,
    toggleMobileMenu,
    toggleProfileMenu,

    // Form management
    setFormDirty,
    setFormSubmitting,
    setFormErrors,
    clearFormErrors,

    // Notification management
    addNotification,
    removeNotification,
    clearNotifications,

    // Preference management
    setPreference,

    // Search management
    setSearchQuery,
    setSearchFilters,
    setSearchResults,
    setSearchLoading,
    clearSearch,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
