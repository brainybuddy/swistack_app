export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const copy = {} as T;
    Object.keys(obj as any).forEach(key => {
      (copy as any)[key] = deepClone((obj as any)[key]);
    });
    return copy;
  }
  return obj;
}

export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isEmptyObject(obj: any): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

export function merge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  const result = { ...target } as any;
  sources.forEach(source => {
    Object.keys(source || {}).forEach(key => {
      if (isObject(result[key]) && isObject((source as any)[key])) {
        result[key] = merge(result[key], (source as any)[key]);
      } else {
        result[key] = (source as any)[key];
      }
    });
  });
  return result;
}