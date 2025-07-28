import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { InsurancePolicy, PolicyDocument, InsuranceCarrier, RedFlag, CoverageBenefit } from '../types/api';

// ============================================================================
// SIMPLIFIED DATA CONTEXT FOR TESTING
// ============================================================================

export interface SimpleDataState {
  policies: InsurancePolicy[];
  documents: PolicyDocument[];
  carriers: InsuranceCarrier[];
  loading: {
    dashboard: boolean;
    policies: boolean;
    documents: boolean;
  };
  errors: {
    dashboard?: string;
    policies?: string;
    documents?: string;
  };
}

export interface SimpleDataContextType {
  state: SimpleDataState;
  
  // Actions
  setPolicies: (policies: InsurancePolicy[]) => void;
  setDocuments: (documents: PolicyDocument[]) => void;
  setCarriers: (carriers: InsuranceCarrier[]) => void;
  setLoading: (key: keyof SimpleDataState['loading'], value: boolean) => void;
  setError: (key: keyof SimpleDataState['errors'], value?: string) => void;
  clearErrors: () => void;
  
  // Getters
  getPolicy: (id: string) => InsurancePolicy | undefined;
  getDocument: (id: string) => PolicyDocument | undefined;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: SimpleDataState = {
  policies: [],
  documents: [],
  carriers: [],
  loading: {
    dashboard: false,
    policies: false,
    documents: false,
  },
  errors: {},
};

// ============================================================================
// CONTEXT
// ============================================================================

const SimpleDataContext = createContext<SimpleDataContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const SimpleDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SimpleDataState>(initialState);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const setPolicies = useCallback((policies: InsurancePolicy[]) => {
    setState(prev => ({ ...prev, policies }));
  }, []);

  const setDocuments = useCallback((documents: PolicyDocument[]) => {
    setState(prev => ({ ...prev, documents }));
  }, []);

  const setCarriers = useCallback((carriers: InsuranceCarrier[]) => {
    setState(prev => ({ ...prev, carriers }));
  }, []);

  const setLoading = useCallback((key: keyof SimpleDataState['loading'], value: boolean) => {
    setState(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        [key]: value,
      },
    }));
  }, []);

  const setError = useCallback((key: keyof SimpleDataState['errors'], value?: string) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [key]: value,
      },
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
    }));
  }, []);

  // ============================================================================
  // GETTERS
  // ============================================================================

  const getPolicy = useCallback((id: string): InsurancePolicy | undefined => {
    return state.policies.find(policy => policy.id === id);
  }, [state.policies]);

  const getDocument = useCallback((id: string): PolicyDocument | undefined => {
    return state.documents.find(document => document.id === id);
  }, [state.documents]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: SimpleDataContextType = {
    state,
    setPolicies,
    setDocuments,
    setCarriers,
    setLoading,
    setError,
    clearErrors,
    getPolicy,
    getDocument,
  };

  return (
    <SimpleDataContext.Provider value={value}>
      {children}
    </SimpleDataContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useSimpleData = (): SimpleDataContextType => {
  const context = useContext(SimpleDataContext);
  if (context === undefined) {
    throw new Error('useSimpleData must be used within a SimpleDataProvider');
  }
  return context;
};
