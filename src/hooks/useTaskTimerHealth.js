import { useEffect, useRef } from 'react';

/**
 * Hook to add resiliency to task timers and prevent them from getting stuck
 * 
 * Features:
 * - Reconciles task timers when app becomes visible after backgrounding
 * - Watchdog timer to detect and fix stuck tasks
 * - Long-press fallback for force-stopping tasks
 * - Persists task health state
 * 
 * Quick validation test plan:
 * 1. Start a task → background the app ~20s → return: elapsed jumps ~20s (timestamps) or task auto-stops (legacy)
 * 2. Simulate stuck state (freeze elapsed, keep isRunning=true): watchdog unsticks within ~4s or long-press → "Force stop" works
 * 
 * @param {Object} params
 * @param {Array} params.tasks - Combined array of recurring and one-time tasks
 * @param {Function} params.setTasks - Function to update tasks state
 * @param {Function} params.getNow - Function to get current timestamp (default: Date.now)
 */
export default function useTaskTimerHealth({ tasks, setTasks, getNow = () => Date.now() }) {
  const intervalRef = useRef(null);
  const stallsRef = useRef(new Map()); // taskId -> { count: number, prevElapsed: number }
  const longPressRef = useRef(new Map()); // taskId -> { timeoutId: number, startTime: number }
  
  // Reconcile function to fix stuck tasks
  const reconcile = () => {
    const now = getNow();
    let hasChanges = false;
    
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (!task.isRunning) return task;
        
        // Check if task appears stuck (no progress in last 5 seconds)
        if (task.lastTickTs && (now - task.lastTickTs) >= 5000) {
          hasChanges = true;
          
          if (task.startTs) {
            // Timestamp-based task: recompute elapsed time
            const elapsedMs = task.accumulatedMs + (now - task.startTs);
            return {
              ...task,
              elapsedMs,
              lastTickTs: now
            };
          } else {
            // Legacy task: force stop
            return {
              ...task,
              isRunning: false,
              lastTickTs: undefined
            };
          }
        }
        
        return task;
      });
      
      return updatedTasks;
    });
    
    return hasChanges;
  };
  
  // Watchdog function to detect stuck tasks
  const runWatchdog = () => {
    const now = getNow();
    
    tasks.forEach(task => {
      if (!task.isRunning) {
        // Reset stall counter for stopped tasks
        stallsRef.current.delete(task.id);
        return;
      }
      
      const taskStalls = stallsRef.current.get(task.id) || { count: 0, prevElapsed: task.elapsedMs || 0 };
      
      // Check if elapsed time hasn't changed
      if (taskStalls.prevElapsed === (task.elapsedMs || 0)) {
        taskStalls.count++;
        
        // If stuck for 2 consecutive checks (4 seconds), reconcile this task
        if (taskStalls.count >= 2) {
          // Force reconcile this specific task
          setTasks(prevTasks => 
            prevTasks.map(t => 
              t.id === task.id 
                ? { ...t, isRunning: false, lastTickTs: undefined }
                : t
            )
          );
          stallsRef.current.delete(task.id);
        } else {
          stallsRef.current.set(task.id, taskStalls);
        }
      } else {
        // Task is progressing, reset stall counter
        taskStalls.count = 0;
        taskStalls.prevElapsed = task.elapsedMs || 0;
        stallsRef.current.set(task.id, taskStalls);
      }
    });
  };
  
  // Long-press handlers
  const handleLongPressStart = (taskId) => {
    const timeoutId = setTimeout(() => {
      // Trigger force stop confirmation in parent component
      // The parent will handle showing the modal and stopping the task
      const event = new CustomEvent('taskLongPress', { 
        detail: { taskId } 
      });
      window.dispatchEvent(event);
    }, 600);
    
    longPressRef.current.set(taskId, {
      timeoutId,
      startTime: getNow()
    });
  };
  
  const handleLongPressEnd = (taskId) => {
    const longPressData = longPressRef.current.get(taskId);
    if (longPressData) {
      clearTimeout(longPressData.timeoutId);
      longPressRef.current.delete(taskId);
    }
  };
  
  // Persist task health state
  const persistTaskHealth = (task) => {
    if (!task.isRunning) return task;
    
    return {
      ...task,
      lastTickTs: getNow()
    };
  };
  
  // Effect for visibility change handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App became visible, reconcile tasks
        reconcile();
      } else {
        // App hidden, persist current state
        setTasks(prevTasks => 
          prevTasks.map(persistTaskHealth)
        );
      }
    };
    
    const handleBeforeUnload = () => {
      // Persist tasks before page unload
      setTasks(prevTasks => 
        prevTasks.map(persistTaskHealth)
      );
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Effect for watchdog timer
  useEffect(() => {
    if (document.visibilityState === 'visible') {
      intervalRef.current = setInterval(runWatchdog, 2000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tasks]);
  
  // Effect for visibility-based interval management
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Start watchdog when visible
        if (!intervalRef.current) {
          intervalRef.current = setInterval(runWatchdog, 2000);
        }
      } else {
        // Stop watchdog when hidden
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Clear all long-press timeouts
      longPressRef.current.forEach(({ timeoutId }) => {
        clearTimeout(timeoutId);
      });
      longPressRef.current.clear();
    };
  }, []);
  
  // Return long-press handlers for use in task components
  return {
    handleLongPressStart,
    handleLongPressEnd
  };
}
