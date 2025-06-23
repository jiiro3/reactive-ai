/**
 * Utility functions for the Reactive AI SDK
 */

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

/**
 * Deep comparison of two objects
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return false;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * Create a deep clone of an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Check if a value has changed from previous value
 */
export function hasChanged<T>(previous: T, current: T, shallow = false): boolean {
  if (shallow) {
    return previous !== current;
  }
  return !deepEqual(previous, current);
}

/**
 * Extract nested property from object using dot notation
 */
export function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested property in object using dot notation
 */
export function setNestedProperty(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a promise that resolves after a delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Async iterator utilities
 */
export async function* map<T, U>(
  iterable: AsyncIterable<T>,
  mapper: (value: T) => U | Promise<U>
): AsyncIterable<U> {
  for await (const value of iterable) {
    yield await mapper(value);
  }
}

export async function* filter<T>(
  iterable: AsyncIterable<T>,
  predicate: (value: T) => boolean | Promise<boolean>
): AsyncIterable<T> {
  for await (const value of iterable) {
    if (await predicate(value)) {
      yield value;
    }
  }
}

export async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const value of iterable) {
    result.push(value);
  }
  return result;
}