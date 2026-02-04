import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UISettings {
  id?: string;
  mode: 'light' | 'dark';
  background_type: 'solid' | 'image' | 'video';
  background_value: string | null;
  enable_motion: boolean;
}

interface ThemeContextType {
  theme: UISettings;
  setTheme: (theme: Partial<UISettings>) => Promise<void>;
  loading: boolean;
}

const defaultTheme: UISettings = {
  mode: 'dark',
  background_type: 'solid',
  background_value: null,
  enable_motion: true,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<UISettings>(defaultTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTheme();
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    if (theme.mode === 'light') {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    } else {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    }

    // Apply motion preference
    if (!theme.enable_motion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [theme]);

  const fetchTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('ui_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching theme:', error);
      } else if (data) {
        setThemeState({
          id: data.id,
          mode: data.mode as 'light' | 'dark',
          background_type: data.background_type as 'solid' | 'image' | 'video',
          background_value: data.background_value,
          enable_motion: data.enable_motion,
        });
      }
    } catch (err) {
      console.error('Theme fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const setTheme = async (updates: Partial<UISettings>) => {
    const newTheme = { ...theme, ...updates };
    setThemeState(newTheme);

    try {
      if (theme.id) {
        await supabase
          .from('ui_settings')
          .update({
            mode: newTheme.mode,
            background_type: newTheme.background_type,
            background_value: newTheme.background_value,
            enable_motion: newTheme.enable_motion,
            updated_at: new Date().toISOString(),
          })
          .eq('id', theme.id);
      }
    } catch (err) {
      console.error('Error saving theme:', err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
