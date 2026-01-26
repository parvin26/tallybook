'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { Business } from '@/types';

interface BusinessContextType {
  currentBusiness: Business | null;
  setCurrentBusiness: (business: Business | null) => void;
  isLoading: boolean;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No business found - this is okay for new users
          setCurrentBusiness(null);
        } else {
          console.error('Error loading business:', {
            code: error.code,
            message: error.message,
          });
          setCurrentBusiness(null);
        }
      } else if (data) {
        setCurrentBusiness(data);
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
    <BusinessContext.Provider value={{ currentBusiness, setCurrentBusiness, isLoading, refreshBusiness }}>
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