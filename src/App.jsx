import React, { useState, useEffect, useRef, useMemo } from 'react';
import goldTexture from "./assets/gold.png";
import motivateVideo from "./assets/motivate.mp4";
import motivateText from "./assets/motivate-text.png";
import startVideo from "./assets/start.mp4";
import startText from "./assets/start-text.png";
import resetVideo from "./assets/reset.mp4";
import resetText from "./assets/reset-text.png";
import spacerImage from "./assets/spacer.png";
import sessionPaused from "./assets/session paused.png";
import productive from "./assets/productive.png";
import unproductive from "./assets/unproductive.png";
import resetOrStartPage from "./assets/reset or start page.png";
import backgroundClouds from "./assets/background clouds.mp4";

function App() {
  const [currentOverlay, setCurrentOverlay] = useState(resetOrStartPage);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [usedTime, setUsedTime] = useState(0);
  const [wastedTime, setWastedTime] = useState(0);
  const [activeTask, setActiveTask] = useState(null);
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  
  // Todo list state
  const [recurringTasks, setRecurringTasks] = useState([
    { id: 1, name: "Cleaning", isActive: false, hasStartedToday: false, timeToday: 0 },
    { id: 2, name: "Practicing Guitar", isActive: false, hasStartedToday: false, timeToday: 0 }
  ]);
  
  const [oneTimeTasks, setOneTimeTasks] = useState([
    { id: 3, name: "Finish Project", isActive: false, timeSpent: 0, timeToday: 0 },
    { id: 4, name: "Read Book", isActive: false, timeSpent: 0, timeToday: 0 }
  ]);

  // Delete confirmation state
  const [tasksToDelete, setTasksToDelete] = useState(new Map()); // taskId -> { countdown: number, taskType: string }
  
  // Completed tasks state
  const [completedTasks, setCompletedTasks] = useState([]);
  
  // Confirmation popup state
  const [showConfirm, setShowConfirm] = useState(false);
  const [taskToConfirm, setTaskToConfirm] = useState(null);

  useEffect(() => {
    let interval;
    if (isSessionPaused) {
      // When session is paused, show static session paused image (no blinking)
      setCurrentOverlay(sessionPaused);
    } else if (isSessionActive && !activeTask) {
      // When session is active but no task is selected, flash between unproductive and reset/start page
      interval = setInterval(() => {
        setCurrentOverlay(prev => prev === unproductive ? resetOrStartPage : unproductive);
      }, 500);
    } else if (isSessionActive && activeTask) {
      // When session is active and task is active, flash between productive and reset/start page
      interval = setInterval(() => {
        setCurrentOverlay(prev => prev === productive ? resetOrStartPage : productive);
      }, 500);
    } else {
      // When session is not active, show static reset/start page
      setCurrentOverlay(resetOrStartPage);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, isSessionPaused, activeTask]);

  // Timer logic for used time (when session is active and task is active)
  useEffect(() => {
    let interval;
    if (isSessionActive && activeTask) {
      interval = setInterval(() => {
        setUsedTime(prev => prev + 1);
        setCurrentSessionTime(prev => prev + 1);
        
        // Update cumulative time for the active task
        if (activeTask.type === 'recurring') {
          setRecurringTasks(prev => prev.map(task => 
            task.id === activeTask.id 
              ? { ...task, timeToday: task.timeToday + 1, hasStartedToday: true }
              : task
          ));
        } else {
          setOneTimeTasks(prev => prev.map(task => 
            task.id === activeTask.id 
              ? { ...task, timeToday: task.timeToday + 1, timeSpent: task.timeSpent + 1 }
              : task
          ));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, activeTask]);

  // Timer logic for wasted time (when session is active but no task is active)
  useEffect(() => {
    let interval;
    if (isSessionActive && !activeTask) {
      interval = setInterval(() => {
        setWastedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, activeTask]);

  // Countdown timer for delete confirmations
  useEffect(() => {
    const intervals = [];
    
    tasksToDelete.forEach((taskData, taskId) => {
      const interval = setInterval(() => {
        setTasksToDelete(prev => {
          const newMap = new Map(prev);
          const currentTask = newMap.get(taskId);
          
          if (currentTask && currentTask.countdown > 1) {
            newMap.set(taskId, { ...currentTask, countdown: currentTask.countdown - 1 });
          } else {
            // Time's up - move task to completed
            newMap.delete(taskId);
            let taskToMove = null;
            
            if (currentTask.taskType === 'recurring') {
              taskToMove = recurringTasks.find(t => t.id === taskId);
              setRecurringTasks(prev => prev.filter(t => t.id !== taskId));
            } else {
              taskToMove = oneTimeTasks.find(t => t.id === taskId);
              setOneTimeTasks(prev => prev.filter(t => t.id !== taskId));
            }
            
            // Move task to completed list
            if (taskToMove) {
              setCompletedTasks(prev => [...prev, { ...taskToMove, completedAt: new Date().toISOString() }]);
            }
          }
          return newMap;
        });
      }, 1000);
      
      intervals.push(interval);
    });

    return () => intervals.forEach(clearInterval);
  }, [tasksToDelete]);

  const handleStartSession = () => {
    if (!isSessionActive && !isSessionPaused) {
      // Start session
      setIsSessionActive(true);
      setIsSessionPaused(false);
    } else if (isSessionActive) {
      // Pause session - automatically stop any active task
      setIsSessionActive(false);
      setIsSessionPaused(true);
      
      // Stop any currently active task as if its stop button was pressed
      if (activeTask) {
        handleStopTask(activeTask.id, activeTask.type);
      }
    } else if (isSessionPaused) {
      // Resume session from paused state
      setIsSessionActive(true);
      setIsSessionPaused(false);
    }
  };

  const handleResetSession = () => {
    setIsSessionActive(false);
    setIsSessionPaused(false);
    setUsedTime(0);
    setWastedTime(0);
    
    // Reset all task timers and checkmarks
    setRecurringTasks(prev => prev.map(task => ({
      ...task,
      timeToday: 0,
      hasStartedToday: false,
      isActive: false
    })));
    
    setOneTimeTasks(prev => prev.map(task => ({
      ...task,
      timeToday: 0,
      isActive: false
    })));
    
    // Clear completed tasks
    setCompletedTasks([]);
    
    // Stop any active task
    if (activeTask) {
      handleStopTask(activeTask.id, activeTask.type);
    }
  };

  const handleStartTask = (taskId, taskType) => {
    // Start session if not already active or if paused
    if (!isSessionActive || isSessionPaused) {
      setIsSessionActive(true);
      setIsSessionPaused(false);
    }
    
    // Stop any currently active task
    if (activeTask) {
      handleStopTask(activeTask.id, activeTask.type);
    }
    
    // Start the new task
    setActiveTask({ id: taskId, type: taskType });
    setTaskStartTime(Date.now());
    setCurrentSessionTime(0);
    
    // Update task state
    if (taskType === 'recurring') {
      setRecurringTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, isActive: true, hasStartedToday: true }
          : { ...task, isActive: false }
      ));
    } else {
      setOneTimeTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, isActive: true }
          : { ...task, isActive: false }
      ));
    }
  };

  const handleStopTask = (taskId, taskType) => {
    if (!activeTask || activeTask.id !== taskId) return;
    
    const timeSpent = Math.floor((Date.now() - taskStartTime) / 1000);
    
    // Update task state
    if (taskType === 'recurring') {
      setRecurringTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, isActive: false, timeToday: task.timeToday + timeSpent }
          : task
      ));
    } else {
      setOneTimeTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, isActive: false, timeSpent: task.timeSpent + timeSpent }
          : task
      ));
    }
    
    setActiveTask(null);
    setTaskStartTime(null);
    setCurrentSessionTime(0);
  };

  const handleCompleteTask = (taskId) => {
    handleStopTask(taskId, 'oneTime');
    setOneTimeTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // Delete confirmation functions
  const initiateDelete = (taskId, taskType) => {
    setTaskToConfirm({ id: taskId, type: taskType });
    setShowConfirm(true);
  };

  const cancelDelete = (taskId) => {
    setTasksToDelete(prev => {
      const newMap = new Map(prev);
      newMap.delete(taskId);
      return newMap;
    });
  };

  const confirmDelete = (taskId, taskType) => {
    let taskToMove = null;
    
    if (taskType === 'recurring') {
      taskToMove = recurringTasks.find(t => t.id === taskId);
      setRecurringTasks(prev => prev.filter(t => t.id !== taskId));
    } else {
      taskToMove = oneTimeTasks.find(t => t.id === taskId);
      setOneTimeTasks(prev => prev.filter(t => t.id !== taskId));
    }
    
    // Move task to completed list
    if (taskToMove) {
      setCompletedTasks(prev => [...prev, { ...taskToMove, completedAt: new Date().toISOString() }]);
    }
    
    setTasksToDelete(prev => {
      const newMap = new Map(prev);
      newMap.delete(taskId);
      return newMap;
    });
  };

  const handleConfirmDelete = () => {
    if (taskToConfirm) {
      confirmDelete(taskToConfirm.id, taskToConfirm.type);
      setShowConfirm(false);
      setTaskToConfirm(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setTaskToConfirm(null);
  };

  // Add task function
  const addNewTask = (taskName) => {
    if (!taskName.trim()) return;
    
    // Generate a unique ID (simple increment for demo)
    const newId = Math.max(...recurringTasks.map(t => t.id), ...oneTimeTasks.map(t => t.id)) + 1;
    
    // Add as a one-time task by default
    const newTask = {
      id: newId,
      name: taskName.trim(),
      isActive: false,
      timeSpent: 0,
      timeToday: 0
    };
    
    setOneTimeTasks(prev => [...prev, newTask]);
  };

  const getOverlayImage = () => {
    return currentOverlay;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatInlineTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}hr ${minutes}min ${secs}sec`;
  };

  const formatShortTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
  };

  const formatBezelTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}min ${secs.toString().padStart(2, '0')}sec`;
  };

  const formatStyledTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    // Split the time string and add styling to colons with blink animation
    const parts = timeString.split(':');
    return (
      <>
        {parts[0]}
        <span className="animate-blink" style={{ textShadow: '0 0 2px white, 0 0 4px white' }}>:</span>
        {parts[1]}
        <span className="animate-blink" style={{ textShadow: '0 0 2px white, 0 0 4px white' }}>:</span>
        {parts[2]}
      </>
    );
  };

  // Calculate visualizer data for completed tasks
  const visualizerData = useMemo(() => {
    if (completedTasks.length === 0) return { maxTime: 0, taskSquares: [] };
    
    // Calculate max time from all completed tasks
    const maxTime = Math.max(...completedTasks.map(task => task.timeToday || task.timeSpent || 0));
    
    // Calculate squares for each task
    const taskSquares = completedTasks.map(task => {
      const taskTime = task.timeToday || task.timeSpent || 0;
      const ratio = maxTime > 0 ? taskTime / maxTime : 0;
      const squares = Math.max(1, Math.round(ratio * 7));
      return { taskId: task.id, squares, taskTime };
    });
    
    return { maxTime, taskSquares };
  }, [completedTasks]);

  return (
    <div className="min-h-screen bg-[#d8c4f0]">
      {/* Secondary background layer - fills entire screen */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover"
        style={{
          zIndex: 0,
          objectPosition: 'top center',
        }}
      >
        <source src={backgroundClouds} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Main content area - starts at top and scrolls naturally */}
      <div className="relative w-full pb-24">
        {/* Centered main container - starts at top */}
        <div className="relative w-full max-w-[720px] mx-auto">
          {/* Main background video - scales with container */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto object-cover"
            style={{
              zIndex: 1,
              objectPosition: 'top center',
            }}
          >
            <source src={backgroundClouds} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Status overlay - scales with container */}
          <img
            src={getOverlayImage()}
            alt="Status Overlay"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{
              zIndex: 10,
              objectPosition: 'top center',
            }}
          />

          {/* Timer display positioned relative to overlay container - using same logic as buttons */}
          <div className="absolute left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center justify-center pointer-events-none" style={{ top: '25%' }}>
            <div className="text-center -translate-y-[19px] max-w-[300px] mx-auto overflow-hidden flex flex-col items-center space-y-[2px]" style={{ fontFamily: 'Orbitron, monospace' }}>
              {/* Used timer - two rows */}
              <div className="text-green-400" style={{ 
                textShadow: '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black',
                fontSize: 'clamp(16px, 5vw, 40px)',
                fontFamily: "'Orbitron', monospace"
              }}>
                <div className={`font-bold ${isSessionActive && activeTask ? 'animate-pulse' : ''}`}>Used:</div>
                <div className="font-semibold tracking-widest">{formatStyledTime(usedTime)}</div>
              </div>
              {/* Session status indicator - positioned between timers with reserved space */}
              <div className="h-6 flex items-center justify-center" style={{ 
                textShadow: '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black',
                fontSize: 'clamp(10px, 2.5vw, 18px)'
              }}>
                <p className={`text-white font-semibold text-sm text-center transition-opacity duration-200 ${
                  (isSessionActive && !isSessionPaused) || isSessionPaused ? 'opacity-100' : 'opacity-0'
                }`}>
                  {isSessionActive && !isSessionPaused && "Session in Progress"}
                  {isSessionPaused && "Session Paused"}
                  {!isSessionActive && !isSessionPaused && ""}
                </p>
              </div>
              {/* Wasted timer - two rows */}
              <div className="text-red-400" style={{ 
                textShadow: '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black',
                fontSize: 'clamp(16px, 5vw, 40px)',
                fontFamily: "'Orbitron', monospace"
              }}>
                <div className={`font-bold ${isSessionActive && !activeTask ? 'animate-pulse' : ''}`}>Wasted:</div>
                <div className="font-semibold tracking-widest">{formatStyledTime(wastedTime)}</div>
              </div>
            </div>
          </div>

          {/* Button group positioned relative to anchor */}
          <div className="absolute left-1/2 transform -translate-x-1/2 z-20" style={{ top: 'calc(45% + 20px)' }}>
            {/* Button container with FIXED WIDTH - never changes regardless of app state */}
            <div className="border border-transparent mx-auto max-w-[400px] w-full">
              {/* Spacer image - fixed size, never scales */}
              <div className="flex justify-center">
                <img 
                  src={spacerImage} 
                  alt="Spacer" 
                  className="w-auto h-auto"
                  style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    opacity: 0
                  }}
                />
              </div>
              
              <div className="flex flex-col items-center gap-4 w-full">
                {/* Three buttons in horizontal row */}
                <div className="flex gap-4 w-full">
                  <div className="flex-1">
                    <button
                      onClick={handleStartSession}
                      className="relative w-full h-[80px] overflow-hidden rounded-xl cursor-pointer"
                    >
                      <video 
                        src={startVideo} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        className="absolute inset-0 w-full h-full object-cover z-0" 
                      />
                      <img 
                        src={startText} 
                        alt="Start/Pause" 
                        className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none" 
                      />
                    </button>
                  </div>
                  {/* Removed Pause Session button */}
                  <div className="flex-1">
                    <button
                      onClick={handleResetSession}
                      className="relative w-full h-[80px] overflow-hidden rounded-xl cursor-pointer"
                    >
                      <video 
                        src={resetVideo} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        className="absolute inset-0 w-full h-full object-cover z-0" 
                      />
                      <img 
                        src={resetText} 
                        alt="Reset" 
                        className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none" 
                      />
                    </button>
                  </div>
                </div>
                {/* Motivate Me button */}
                <div className="w-full">
                  <button className="relative w-full h-[80px] overflow-hidden rounded-xl cursor-pointer">
                    <video 
                      src={motivateVideo} 
                      autoPlay 
                      muted 
                      loop 
                      playsInline 
                      className="absolute inset-0 w-full h-full object-cover z-0" 
                    />
                    <img 
                      src={motivateText} 
                      alt="Motivate Me" 
                      className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none" 
                    />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Conditional elements - COMPLETELY SEPARATE (no interaction with button container) */}
            <div className="mt-4" style={{ position: 'relative', zIndex: 10 }}>
              <div className="min-h-[60px] flex items-center justify-center">
                {/* Instructional sign - only show when session is active but no task is selected */}
                {isSessionActive && !activeTask && (
                  <div className="text-center mt-[-4px]">
                    <div className="font-bold text-base sm:text-lg mb-2 animate-pulse" style={{
                      textShadow: '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black, 0 0 10px white, 0 0 20px white',
                      color: '#FBBF24'
                    }}>
                      Click a task to stop wasting time
                    </div>
                    <div className="text-2xl animate-bounce flex justify-center items-center gap-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
                        backgroundImage: `url(${goldTexture})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(1px 1px 0px black) drop-shadow(-1px -1px 0px black) drop-shadow(1px -1px 0px black) drop-shadow(-1px 1px 0px black)'
                      }}>
                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
                        backgroundImage: `url(${goldTexture})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(1px 1px 0px black) drop-shadow(-1px -1px 0px black) drop-shadow(1px -1px 0px black) drop-shadow(-1px 1px 0px black)'
                      }}>
                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
                        backgroundImage: `url(${goldTexture})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(1px 1px 0px black) drop-shadow(-1px -1px 0px black) drop-shadow(1px -1px 0px black) drop-shadow(-1px 1px 0px black)'
                      }}>
                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Task in Progress Mini View - show when session is active and task is selected */}
                {isSessionActive && activeTask && (
                  <div className="text-center mt-[-4px] bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-green-400 shadow-lg animate-pulse" style={{ width: 'fit-content', minWidth: '200px' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-left">
                        <div className="text-green-400 font-bold text-sm sm:text-base mb-1" style={{
                          textShadow: '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black'
                        }}>
                          Task in Progress
                        </div>
                        <div className="text-white font-medium text-base sm:text-lg mb-2">
                          {activeTask.name}
                        </div>
                        <div className="text-green-400 text-sm sm:text-base font-mono" style={{
                          textShadow: '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black'
                        }}>
                          {formatTime(currentSessionTime)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleStopTask(activeTask.id, activeTask.type)}
                        className="w-16 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors ml-3"
                        title="Stop Task"
                      >
                        ⏹️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Invisible anchor for todo positioning */}
            <div id="todo-anchor" className="h-5"></div>
          </div>

          {/* Task Manager - Clean Mobile-First Layout */}
          <div className="absolute left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center px-4 w-full max-w-[95vw]" style={{ top: 'calc(45% + 20px + 300px)' }}>
            <div className="w-full max-w-6xl">
              <div className="bg-white rounded-lg shadow-lg">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 text-center">Tasks</h2>
                </div>
                
                {/* Task List */}
                <div className="overflow-x-hidden">
                  {/* Combined tasks list */}
                  {[
                    ...recurringTasks.map(task => ({ ...task, taskType: 'recurring' })),
                    ...oneTimeTasks.map(task => ({ ...task, taskType: 'oneTime' }))
                  ].map(task => {
                    const isDeleting = tasksToDelete.has(task.id);
                    const deleteData = tasksToDelete.get(task.id);
                    
                    return (
                      <div 
                        key={`task-${task.id}`} 
                        className={`flex items-center justify-between p-4 border-b border-gray-100 transition-all duration-200 ${
                          task.isActive 
                            ? 'bg-green-50 border-green-200 animate-pulse' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        {isDeleting ? (
                          /* Undo Button UI */
                          <div className="flex-1 flex items-center justify-center gap-3">
                            <button
                              onClick={() => cancelDelete(task.id)}
                              className="text-blue-600 hover:text-blue-700 font-medium underline transition-colors cursor-pointer"
                            >
                              Undo
                            </button>
                            <button
                              onClick={() => cancelDelete(task.id)}
                              className="text-red-500 font-mono text-lg font-bold cursor-pointer hover:no-underline focus:outline-none"
                            >
                              00:{String(deleteData?.countdown).padStart(2, '0')}
                            </button>
                          </div>
                        ) : (
                          /* Normal Task UI */
                          <>
                            {/* Task Name */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-800 break-words whitespace-normal w-full">{task.name}</span>
                                {(task.hasStartedToday || task.timeToday > 0) && (
                                  <span className="text-green-500 text-sm flex-shrink-0">✓</span>
                                )}
                              </div>
                              {/* Timer display for active tasks */}
                              {(task.timeToday > 0 || task.isActive) && (
                                <div className="flex flex-col items-center space-y-1 text-xs font-semibold text-center mt-1">
                                  {task.timeToday > 0 && (
                                    <p className="text-green-600">Today: {formatInlineTime(task.timeToday)}</p>
                                  )}
                                  {task.isActive && (
                                    <p className="text-blue-600">Session: {formatInlineTime(currentSessionTime)}</p>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Start/Stop Button */}
                            <div className="flex items-center gap-2 ml-4">
                              {task.isActive ? (
                                <button
                                  onClick={() => handleStopTask(task.id, task.taskType)}
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                                  title="Stop Task"
                                >
                                  ⏹️
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartTask(task.id, task.taskType)}
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
                                  title="Start Task"
                                >
                                  ▶️
                                </button>
                              )}
                              
                              {/* Clear Button */}
                              <button
                                onClick={() => initiateDelete(task.id, task.taskType)}
                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                                title="Clear Task"
                              >
                                <span className="text-2xl">🗑️</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Add Task Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Add new task..."
                        className="w-full sm:w-[70%] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            addNewTask(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add new task..."]');
                          if (input && input.value.trim()) {
                            addNewTask(input.value);
                            input.value = '';
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tasks Completed Section */}
            <div className="mt-6 mb-10 w-full max-w-6xl overflow-x-hidden">
              <div className="bg-white rounded-xl shadow-md">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 text-center">Tasks Completed</h3>
                </div>
                
                {/* Completed Tasks List */}
                <div className="overflow-x-hidden">
                  {completedTasks.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No tasks completed yet
                    </div>
                  ) : (
                    completedTasks.map((task, index) => {
                      const visualizer = visualizerData.taskSquares.find(v => v.taskId === task.id);
                      return (
                        <div 
                          key={`completed-${task.id}-${index}`} 
                          className="flex items-center justify-between p-4 border-b border-gray-100 bg-white hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="text-center">
                              <p className="font-medium text-gray-600">{task.name}</p>
                              {(task.timeToday > 0 || task.timeSpent > 0) && (
                                <p className="text-sm text-gray-500">{formatInlineTime(task.timeToday || task.timeSpent)}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Square Visualizer */}
                            <div className="flex gap-1">
                              {[...Array(7)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-3 h-3 rounded-sm ${
                                    i < (visualizer?.squares || 0) 
                                      ? 'bg-green-500' 
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-green-500 text-sm">✓</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Clear All Button at Bottom */}
                {completedTasks.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => setCompletedTasks([])}
                      className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
         </div>
       </div>

       {/* Invisible anchor div positioned below watch bezel */}
       <div id="button-anchor" className="absolute inset-0 w-full h-[20px] pointer-events-none" style={{ top: '45%', zIndex: 15 }}></div>
       
       {/* Confirmation Popup Modal */}
       {showConfirm && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
           <div className="bg-white p-4 rounded-lg shadow-md max-w-sm w-full mx-4 text-center">
             <p className="text-sm mb-3 text-gray-700">Move to Tasks Completed?</p>
             <div className="flex justify-center gap-2">
               <button 
                 onClick={handleConfirmDelete} 
                 className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
               >
                 OK
               </button>
               <button 
                 onClick={handleCancelDelete} 
                 className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded transition-colors"
               >
                 Cancel
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

 export default App;