type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
// Default to "warn" to keep consoles clean; can be raised with VITE_LOG_LEVEL=info|debug
const configuredLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined)?.toLowerCase() as LogLevel | undefined;
const LOG_LEVEL: LogLevel = configuredLevel && configuredLevel in levelPriority
  ? configuredLevel
  : import.meta.env.DEV
    ? 'info'
    : 'warn';
const shouldLog = (level: LogLevel) => levelPriority[level] >= levelPriority[LOG_LEVEL];
export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) console.warn(...args);
  },
  error: (...args: unknown[]) => console.error(...args),
};
