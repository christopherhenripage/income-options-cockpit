// Production-safe logger that respects environment

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel;
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
    this.minLevel = this.isDev ? 'debug' : 'warn';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private output(entry: LogEntry): void {
    if (this.isDev) {
      // Pretty print in development
      const prefix = `[${entry.level.toUpperCase()}]`;
      if (entry.data) {
        console[entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log'](
          prefix,
          entry.message,
          entry.data
        );
      } else {
        console[entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log'](
          prefix,
          entry.message
        );
      }
    } else {
      // JSON format in production (for log aggregation)
      console[entry.level === 'error' ? 'error' : 'log'](JSON.stringify(entry));
    }
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatEntry('debug', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      this.output(this.formatEntry('info', message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatEntry('warn', message, data));
    }
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog('error')) {
      this.output(this.formatEntry('error', message, data));
    }
  }
}

export const logger = new Logger();

// Helper for API routes
export function logApiError(route: string, error: unknown, context?: Record<string, unknown>): void {
  logger.error(`API Error in ${route}`, {
    error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    ...context,
  });
}

export function logApiRequest(route: string, method: string, context?: Record<string, unknown>): void {
  logger.info(`API Request: ${method} ${route}`, context);
}
