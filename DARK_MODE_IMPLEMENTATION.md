# Dark Mode Implementation Plan

## Problem
CSS varijable za dark mode postoje, ali nema toggle funkcionalnosti.

## Rješenje

### 1. Kreiraj ThemeProvider

**src/contexts/ThemeContext.tsx:**
```typescript
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Pročitaj iz localStorage
    const stored = localStorage.getItem('vremeplov-theme') as Theme;
    return stored || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Decide resolved theme
    let resolved: 'light' | 'dark' = 'light';

    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = theme;
    }

    setResolvedTheme(resolved);

    // Apply to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);

    // Persist to localStorage
    localStorage.setItem('vremeplov-theme', theme);
  }, [theme]);

  // Listen to system preference changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### 2. Wrap App sa ThemeProvider

**src/main.tsx:**
```typescript
import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

### 3. Kreiraj ThemeToggle Komponentu

**src/components/ThemeToggle.tsx:**
```typescript
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>{t('theme.light') || 'Light'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>{t('theme.dark') || 'Dark'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>{t('theme.system') || 'System'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 4. Dodaj u PageHeader

**src/components/PageHeader.tsx:**
```typescript
import ThemeToggle from './ThemeToggle';

// Unutar PageHeader komponente, dodaj:
<ThemeToggle />
<LanguageSelector />
<NotificationBell />
<UserProfile />
```

### 5. Dodaj Prijevode

**src/locales/hr.json:**
```json
{
  "theme": {
    "light": "Svijetli",
    "dark": "Tamni",
    "system": "Automatski"
  }
}
```

**src/locales/en.json:**
```json
{
  "theme": {
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  }
}
```

### 6. Testiranje

1. Klikni na ThemeToggle button u PageHeader
2. Odaberi "Light", "Dark", ili "System"
3. Provjeri da se tema mijenja
4. Refresh page - tema bi trebala ostati ista (localStorage)
5. Provjeri system preference - promijeni OS theme, app bi trebao automatski promijeniti (ako je "System" odabrano)

### 7. Dark Mode CSS Provjera

Provjeri da sve komponente dobro izgledaju u dark modeu. Neke komponente mogu imati hardcoded boje koje treba zamijeniti sa CSS varijablama:

**Primjeri koji trebaju provjeru:**
- `bg-white` → `bg-background`
- `text-gray-900` → `text-foreground`
- `border-gray-200` → `border-border`

**Globalna pravila (index.css je već dobro):**
```css
body {
  @apply bg-[hsl(var(--background))] text-[hsl(var(--foreground))];
}
```

## Prioritet
🔴 **VISOK** - Ovo je jedna od najčešćih funkcionalnosti moderne web aplikacije.

## Vrijeme implementacije
⏱️ **30-60 minuta** - jednostavna implementacija
