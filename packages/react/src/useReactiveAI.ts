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
  const previousWatchRef = useRef<T[]>();

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

  return {
    isReady,
    isExecuting,
    lastError,
    addAction,
    removeAction,
    reset
  };
}