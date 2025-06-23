import { useEffect, useRef, useState, useCallback } from 'react';
import { CoreReactiveEngine, ReactiveAction, deepEqual } from '@reactive-ai/core';
import { UseReactiveAIConfig, ReactiveAIHookReturn } from './types';

/**
 * Main React hook for reactive AI state management
 */
export function useReactiveAI<T = any>(
  config: UseReactiveAIConfig<T>
): ReactiveAIHookReturn {
  const engineRef = useRef<CoreReactiveEngine<T[]>>();
  const [isReady, setIsReady] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const previousWatchRef = useRef<T[]>();
  const idleTimerRef = useRef<NodeJS.Timeout>();
  const idleIntervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Get current watch values
  const getCurrentWatchValues = useCallback((): T[] => {
    return typeof config.watch === 'function' ? config.watch() : config.watch;
  }, [config.watch]);

  // Initialize engine
  useEffect(() => {
    const engine = new CoreReactiveEngine<T[]>();
    
    const watchValues = getCurrentWatchValues();
    
    engine.configure({
      state: watchValues,
      providers: config.providers,
      actions: config.actions.map(action => ({
        ...action,
        execute: async (context) => {
          setIsExecuting(true);
          try {
            await action.execute(context);
            setLastError(null);
          } catch (error) {
            setLastError(error as Error);
            throw error;
          } finally {
            setIsExecuting(false);
          }
        }
      })),
      onError: (error, context) => {
        setLastError(error);
        config.onError?.(error, context);
      },
      debug: config.debug
    });

    engineRef.current = engine;
    previousWatchRef.current = watchValues;
    setIsReady(true);

    return () => {
      engine.destroy();
      setIsReady(false);
    };
  }, [config.providers, config.debug]); // Only recreate on provider/debug changes

  // Watch for state changes
  useEffect(() => {
    if (!engineRef.current || !isReady) return;

    const currentValues = getCurrentWatchValues();
    const previousValues = previousWatchRef.current;

    // Check if values have changed
    if (previousValues && !deepEqual(previousValues, currentValues)) {
      engineRef.current.updateState(currentValues);
      
      // Reset idle timer on activity
      lastActivityRef.current = Date.now();
      setIsIdle(false);
      
      if (config.idle) {
        // Clear existing idle timer
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
        if (idleIntervalRef.current) {
          clearInterval(idleIntervalRef.current);
        }
        
        // Set new idle timer
        idleTimerRef.current = setTimeout(() => {
          setIsIdle(true);
          
          // Execute idle action
          const executeIdleAction = async () => {
            if (!isExecuting && engineRef.current) {
              try {
                setIsExecuting(true);
                await config.idle!.action.execute({
                  state: getCurrentWatchValues(),
                  providers: config.providers,
                  previousState: previousWatchRef.current || []
                });
              } catch (error) {
                setLastError(error as Error);
                config.onError?.(error as Error, {
                  state: getCurrentWatchValues(),
                  providers: config.providers,
                  previousState: previousWatchRef.current || []
                });
              } finally {
                setIsExecuting(false);
              }
            }
          };
          
          // Execute immediately
          executeIdleAction();
          
          // Set up repeat interval if configured
          if (config.idle.repeat && config.idle.interval) {
            idleIntervalRef.current = setInterval(executeIdleAction, config.idle.interval);
          }
        }, config.idle.timeout);
      }
    }

    previousWatchRef.current = currentValues;
  }, config.dependencies || [config.watch]);

  // Update actions when they change
  useEffect(() => {
    if (!engineRef.current || !isReady) return;

    // Clear existing actions and add new ones
    // Note: This is a simplified approach - in production you'd want smarter diffing
    engineRef.current.destroy();
    
    const engine = new CoreReactiveEngine<T[]>();
    const watchValues = getCurrentWatchValues();
    
    engine.configure({
      state: watchValues,
      providers: config.providers,
      actions: config.actions.map(action => ({
        ...action,
        execute: async (context) => {
          setIsExecuting(true);
          try {
            await action.execute(context);
            setLastError(null);
          } catch (error) {
            setLastError(error as Error);
            throw error;
          } finally {
            setIsExecuting(false);
          }
        }
      })),
      onError: (error, context) => {
        setLastError(error);
        config.onError?.(error, context);
      },
      debug: config.debug
    });

    engineRef.current = engine;
  }, [config.actions]);

  const addAction = useCallback((action: ReactiveAction<T[]>) => {
    if (engineRef.current) {
      engineRef.current.addAction(action);
    }
  }, []);

  const removeAction = useCallback((actionId: string) => {
    if (engineRef.current) {
      engineRef.current.removeAction(actionId);
    }
  }, []);

  const reset = useCallback(() => {
    setLastError(null);
    setIsExecuting(false);
  }, []);

  // Cleanup idle timers on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
      }
    };
  }, []);

  return {
    isReady,
    isExecuting,
    lastError,
    isIdle,
    addAction,
    removeAction,
    reset
  };
}