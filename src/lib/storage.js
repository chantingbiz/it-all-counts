// Storage abstraction layer for the "It All Counts" app
// Provides a unified interface for local and cloud storage

// Track the active adapter for getActiveAdapter()
let activeAdapter = null;

// Local storage implementation using versioned keys
export function createLocalStore() {
  const STORAGE_KEYS = {
    TODOS: 'iac.todos.v1',
    VIDEO_SETTINGS: 'iac.videoSettings.v1'
  };

  const defaultTodosState = {
    recurringTasks: [
      { id: 1, name: "Cleaning", isActive: false, hasStartedToday: false, timeToday: 0 },
      { id: 2, name: "Practicing Guitar", isActive: false, hasStartedToday: false, timeToday: 0 }
    ],
    oneTimeTasks: [
      { id: 3, name: "Finish Project", isActive: false, timeSpent: 0, timeToday: 0 },
      { id: 4, name: "Read Book", isActive: false, timeSpent: 0, timeToday: 0 }
    ],
    completedTasks: []
  };

  const defaultVideoSettings = {
    selectedGroupIds: new Set(["fun"])
  };

  return {
    adapterName: "local",
    async loadTodos() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.TODOS);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert arrays back to proper structure
          return {
            recurringTasks: parsed.recurringTasks || defaultTodosState.recurringTasks,
            oneTimeTasks: parsed.oneTimeTasks || defaultTodosState.oneTimeTasks,
            completedTasks: parsed.completedTasks || defaultTodosState.completedTasks
          };
        }
        return defaultTodosState;
      } catch (error) {
        console.warn('Failed to load todos from localStorage:', error);
        return defaultTodosState;
      }
    },

    async saveTodos(state) {
      try {
        localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save todos to localStorage:', error);
      }
    },

    async loadVideoSettings() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.VIDEO_SETTINGS);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert array back to Set
          return {
            selectedGroupIds: new Set(parsed.selectedGroupIds || defaultVideoSettings.selectedGroupIds)
          };
        }
        return defaultVideoSettings;
      } catch (error) {
        console.warn('Failed to load video settings from localStorage:', error);
        return defaultVideoSettings;
      }
    },

    async saveVideoSettings(settings) {
      try {
        // Convert Set to array for JSON serialization
        const serializable = {
          selectedGroupIds: Array.from(settings.selectedGroupIds)
        };
        localStorage.setItem(STORAGE_KEYS.VIDEO_SETTINGS, JSON.stringify(serializable));
      } catch (error) {
        console.error('Failed to save video settings to localStorage:', error);
      }
    },

    // Optional onChange hook (no-op for local storage)
    onChange(callback) {
      // Local storage doesn't support real-time changes
      return () => {}; // Return cleanup function
    }
  };
}

// Factory function that chooses storage adapter based on environment
export async function createStorage() {
  const useCloud = import.meta.env.VITE_CLOUD_SYNC === "true";
  
  if (useCloud) {
    try {
      const { createCloudStore } = await import("./storageCloudSupabase.js");
      const cloudStore = await createCloudStore();
      activeAdapter = "cloud";
      return cloudStore;
    } catch (error) {
      console.warn('Failed to load cloud storage, falling back to local:', error);
      const localStore = createLocalStore();
      activeAdapter = "local";
      return localStore;
    }
  }
  
  const localStore = createLocalStore();
  activeAdapter = "local";
  return localStore;
}

// Function to get the currently active storage adapter
export function getActiveAdapter() {
  return activeAdapter || "local";
}

