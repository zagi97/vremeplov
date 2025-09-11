// src/lib/securityMiddleware.ts
import { User } from 'firebase/auth';

// IP-based rate limiting (fallback ako nema user)
class IPRateLimit {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  
  canMakeRequest(ip: string, maxRequests: number = 100, windowMs: number = 3600000): boolean {
    const now = Date.now();
    const userLimit = this.requests.get(ip);
    
    if (!userLimit || now > userLimit.resetTime) {
      this.requests.set(ip, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (userLimit.count >= maxRequests) {
      return false;
    }
    
    userLimit.count++;
    return true;
  }
  
  getRemainingRequests(ip: string, maxRequests: number = 100): number {
    const userLimit = this.requests.get(ip);
    if (!userLimit) return maxRequests;
    return Math.max(0, maxRequests - userLimit.count);
  }
}

// Singleton instance
const ipRateLimit = new IPRateLimit();

// File validation
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Size check (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File previše velik. Maksimalno 5MB.' };
  }
  
  // Type check
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Nepodržan tip datoteke. Koristite JPEG, PNG, WebP ili GIF.' };
  }
  
  // Filename check (basic XSS prevention)
  const dangerousChars = /<script|javascript:|data:/i;
  if (dangerousChars.test(file.name)) {
    return { valid: false, error: 'Neispravno ime datoteke.' };
  }
  
  return { valid: true };
};

// Content validation
export const validateImageContent = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Dimension checks
      if (img.width > 4000 || img.height > 4000) {
        resolve({ valid: false, error: 'Slika previše velika. Maksimalno 4000x4000 piksela.' });
        return;
      }
      
      if (img.width < 100 || img.height < 100) {
        resolve({ valid: false, error: 'Slika premala. Minimalno 100x100 piksela.' });
        return;
      }
      
      resolve({ valid: true });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: 'Neispravna datoteka slike.' });
    };
    
    img.src = url;
  });
};

// Request rate limiting
export const checkRequestRateLimit = (user: User | null): boolean => {
  // Ako imaš user ID, koristi ga; inače koristi basic IP limiting
  const identifier = user?.uid || 'anonymous';
  
  if (user) {
    // Za autentificirane korisnike - koristi localStorage
    const key = `rateLimit_${identifier}`;
    const stored = localStorage.getItem(key);
    const now = Date.now();
    
    if (stored) {
      const { count, resetTime } = JSON.parse(stored);
      
      if (now > resetTime) {
        // Reset
        localStorage.setItem(key, JSON.stringify({ count: 1, resetTime: now + 3600000 }));
        return true;
      }
      
      if (count >= 200) { // 200 requests per hour za authenticated users
        return false;
      }
      
      localStorage.setItem(key, JSON.stringify({ count: count + 1, resetTime }));
      return true;
    } else {
      localStorage.setItem(key, JSON.stringify({ count: 1, resetTime: now + 3600000 }));
      return true;
    }
  } else {
    // Za anonimne korisnike - basic IP limiting
    return ipRateLimit.canMakeRequest('anonymous', 50, 3600000); // 50 requests per hour
  }
};

// CSRF-like protection
export const generateSecurityToken = (): string => {
  return btoa(Date.now() + Math.random().toString()).slice(0, 16);
};

export const validateSecurityToken = (token: string, maxAge: number = 3600000): boolean => {
  try {
    const decoded = atob(token);
    const timestamp = parseInt(decoded);
    return Date.now() - timestamp < maxAge;
  } catch {
    return false;
  }
};

// Usage in komponente:
export const useSecurityCheck = () => {
  const performSecurityCheck = (file?: File, user?: User | null): Promise<{ allowed: boolean; error?: string }> => {
    return new Promise(async (resolve) => {
      // 1. Rate limit check
      if (!checkRequestRateLimit(user || null)) {
        resolve({ allowed: false, error: 'Previše zahtjeva. Pokušajte ponovno za sat vremena.' });
        return;
      }
      
      // 2. File validation (ako postoji)
      if (file) {
        const fileCheck = validateFile(file);
        if (!fileCheck.valid) {
          resolve({ allowed: false, error: fileCheck.error });
          return;
        }
        
        const contentCheck = await validateImageContent(file);
        if (!contentCheck.valid) {
          resolve({ allowed: false, error: contentCheck.error });
          return;
        }
      }
      
      resolve({ allowed: true });
    });
  };
  
  return { performSecurityCheck };
};