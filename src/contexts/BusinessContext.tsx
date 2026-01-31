'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { Business } from '@/types';
import { setActiveBusinessId } from '@/lib/businessId';

interface BusinessContextType {
  currentBusiness: Business | null;
  setCurrentBusiness: (business: Business | null) => void;
  isLoading: boolean;
  needsBusiness: boolean;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsBusiness, setNeedsBusiness] = useState(false);

  // Wrapper to persist businessId to localStorage when business changes
  const setCurrentBusiness = (business: Business | null) => {
    setCurrentBusinessState(business);
    setActiveBusinessId(business?.id || null);
    setNeedsBusiness(business === null);
  };

  const loadBusiness = async () => {
    try {
      setIsLoading(true);
      
      // Check for dev mode or test mode bypass
      const devBypass = typeof window !== 'undefined' && sessionStorage.getItem('dev-bypass-auth') === 'true'
      const allowTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_MODE === 'true'
      
      if (devBypass && (process.env.NODE_ENV === 'development' || allowTestMode)) {
        // In dev mode with bypass, get the first active business (for testing)
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // No business found - this is okay
            setCurrentBusiness(null);
          } else {
            console.error('Error loading business (dev bypass):', {
              code: error.code,
              message: error.message,
            });
            setCurrentBusiness(null);
          }
        } else if (data) {
          setCurrentBusiness(data);
        } else {
          setCurrentBusiness(null);
          setNeedsBusiness(true);
        }
        setIsLoading(false);
        return;
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // User is not authenticated - reset business state immediately
        if (process.env.NODE_ENV === 'development') {
          console.log('[BusinessContext] No user found, resetting business state')
        }
        setCurrentBusiness(null);
        setNeedsBusiness(false);
        setIsLoading(false);
        return;
      }
      
      // Fetch all active businesses for the user
      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading businesses:', {
          code: error.code,
          message: error.message,
        });
        setCurrentBusiness(null);
        setNeedsBusiness(false);
        setActiveBusinessId(null);
        return;
      }
      
      // Deterministic business selection
      if (!businesses || businesses.length === 0) {
        // No businesses: user needs to create one
        setCurrentBusiness(null);
        setNeedsBusiness(true);
        setActiveBusinessId(null);
      } else if (businesses.length === 1) {
        // One business: use it
        setCurrentBusiness(businesses[0]);
        setNeedsBusiness(false);
      } else {
        // Multiple businesses: use persisted id if valid, else use most recent
        const persistedId = typeof window !== 'undefined' 
          ? localStorage.getItem('tally-business-id')
          : null;
        
        const persistedBusiness = persistedId 
          ? businesses.find(b => b.id === persistedId)
          : null;
        
        const selectedBusiness = persistedBusiness || businesses[0];
        setCurrentBusiness(selectedBusiness);
        setNeedsBusiness(false);
      }
    } catch (err) {
      console.error('Error in loadBusiness:', err);
      setCurrentBusiness(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBusiness();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // If user signed out, immediately reset business state
      if (event === 'SIGNED_OUT' || !session) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[BusinessContext] Auth signed out, resetting business state')
        }
        setCurrentBusiness(null);
        setIsLoading(false);
        return;
      }
      
      // Only reload business if user signed in or token refreshed
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadBusiness();
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const refreshBusiness = async () => {
    await loadBusiness();
  };

  return (
    <BusinessContext.Provider value={{ currentBusiness, setCurrentBusiness, isLoading, needsBusiness, refreshBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return ctx;
}