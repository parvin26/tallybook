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
      
      // Check for dev mode bypass
      const devBypass = typeof window !== 'undefined' && sessionStorage.getItem('dev-bypass-auth') === 'true'
      
      if (devBypass && process.env.NODE_ENV === 'development') {
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadBusiness();
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