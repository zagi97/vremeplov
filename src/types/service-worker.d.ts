// src/types/service-worker.d.ts
// Type extensions za Service Worker API-je

interface ServiceWorkerRegistration {
  // Background Sync API
  sync?: {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
  
  // Periodic Background Sync (za buduće korištenje)
  periodicSync?: {
    register(tag: string, options?: { minInterval?: number }): Promise<void>;
    getTags(): Promise<string[]>;
    unregister(tag: string): Promise<void>;
  };
}

// Za korištenje u service worker file-u
interface SyncEvent extends ExtendableEvent {
  tag: string;
  lastChance: boolean;
}

interface PeriodicSyncEvent extends ExtendableEvent {
  tag: string;
}

// Service Worker Global Scope extensions
declare var self: ServiceWorkerGlobalScope;

interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
  addEventListener(type: 'sync', listener: (event: SyncEvent) => void): void;
  addEventListener(type: 'periodicsync', listener: (event: PeriodicSyncEvent) => void): void;
  
  // Background Fetch API (za velike file uploads)
  registration: ServiceWorkerRegistration & {
    backgroundFetch?: {
      fetch(id: string, request: RequestInfo, options?: any): Promise<any>;
      get(id: string): Promise<any>;
      getIds(): Promise<string[]>;
    };
  };
}