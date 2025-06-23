import { ReactiveEngine, ReactiveConfig, ReactiveAction, ActionContext } from './types';
import { debounce, throttle } from './utils';

/**
 * Core reactive engine that manages state watching and action execution
 */
export class CoreReactiveEngine<T = any> implements ReactiveEngine<T> {
  private config: ReactiveConfig<T> | null = null;
  private currentState: T | null = null;
  private previousState: T | null = null;
  private actions: Map<string, ReactiveAction<T>> = new Map();
  private executingActions: Set<string> = new Set();
  private isDestroyed = false;

  configure(config: ReactiveConfig<T>): void {
    if (this.isDestroyed) {
      throw new Error('Cannot configure destroyed reactive engine');
    }

    this.config = config;
    this.currentState = config.state;
    
    // Register all actions
    config.actions.forEach(action => {
      this.addAction(action);
    });

    this.log('Engine configured with', config.actions.length, 'actions');
  }

  async updateState(newState: T): Promise<void> {
    if (this.isDestroyed || !this.config) return;

    const oldState = this.currentState;
    this.previousState = oldState;
    this.currentState = newState;

    const timestamp = Date.now();
    this.log('State updated', { oldState, newState, timestamp });

    // Process all registered actions
    const actionPromises = Array.from(this.actions.values()).map(action =>
      this.processAction(action, oldState, newState, timestamp)
    );

    await Promise.allSettled(actionPromises);
  }

  addAction(action: ReactiveAction<T>): void {
    const actionId = action.id || this.generateActionId();
    const wrappedAction = this.wrapActionWithControls(action);
    
    this.actions.set(actionId, { ...wrappedAction, id: actionId });
    this.log('Action added:', actionId);
  }

  removeAction(actionId: string): void {
    if (this.actions.delete(actionId)) {
      this.log('Action removed:', actionId);
    }
  }

  destroy(): void {
    this.actions.clear();
    this.executingActions.clear();
    this.config = null;
    this.currentState = null;
    this.previousState = null;
    this.isDestroyed = true;
    this.log('Engine destroyed');
  }

  private async processAction(
    action: ReactiveAction<T>, 
    oldState: T | null, 
    newState: T, 
    timestamp: number
  ): Promise<void> {
    if (!this.config || !oldState) return;

    const actionId = action.id!;

    try {
      // Check if action should be triggered
      const shouldTrigger = action.trigger(oldState, newState, { timestamp });
      if (!shouldTrigger) return;

      // Check conditions
      const context: ActionContext<T> = {
        state: newState,
        providers: this.config.providers,
        metadata: {
          trigger: actionId,
          timestamp,
          previousState: oldState
        }
      };

      if (action.conditions && !action.conditions.every(condition => condition(context))) {
        this.log('Action conditions not met:', actionId);
        return;
      }

      // Prevent re-triggering if configured
      if (action.preventDefault && this.executingActions.has(actionId)) {
        this.log('Action execution prevented (already executing):', actionId);
        return;
      }

      // Execute action
      this.executingActions.add(actionId);
      this.log('Executing action:', actionId);
      
      await action.execute(context);
      
      this.log('Action completed:', actionId);
    } catch (error) {
      this.log('Action error:', actionId, error);
      if (this.config.onError) {
        const context: ActionContext<T> = {
          state: newState,
          providers: this.config.providers,
          metadata: {
            trigger: actionId,
            timestamp,
            previousState: oldState
          }
        };
        this.config.onError(error as Error, context);
      }
    } finally {
      this.executingActions.delete(actionId);
    }
  }

  private wrapActionWithControls(action: ReactiveAction<T>): ReactiveAction<T> {
    let execute = action.execute;

    // Apply debounce if specified
    if (action.debounce && action.debounce > 0) {
      execute = debounce(execute, action.debounce);
    }

    // Apply throttle if specified
    if (action.throttle && action.throttle > 0) {
      execute = throttle(execute, action.throttle);
    }

    return {
      ...action,
      execute
    };
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(...args: any[]): void {
    if (this.config?.debug) {
      console.log('[ReactiveAI]', ...args);
    }
  }
}