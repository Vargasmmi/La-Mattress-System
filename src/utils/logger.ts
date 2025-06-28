export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}

class Logger {
  private minLevel: LogLevel;
  private isProduction: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    // Detectar producción basado en hostname o manual override
    this.isProduction = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
    this.minLevel = this.isProduction ? LogLevel.ERROR : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.minLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${levelName} ${contextStr} ${message}`;
  }

  private addToHistory(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  error(message: string, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      data,
      context
    };
    
    this.addToHistory(entry);
    
    if (!this.isProduction) {
      console.error(`❌ ${this.formatMessage(LogLevel.ERROR, message, context)}`, data);
    }
  }

  warn(message: string, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
      data,
      context
    };
    
    this.addToHistory(entry);
    
    if (!this.isProduction) {
      console.warn(`⚠️ ${this.formatMessage(LogLevel.WARN, message, context)}`, data);
    }
  }

  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      data,
      context
    };
    
    this.addToHistory(entry);
    
    if (!this.isProduction) {
      console.log(`ℹ️ ${this.formatMessage(LogLevel.INFO, message, context)}`, data);
    }
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
      data,
      context
    };
    
    this.addToHistory(entry);
    
    if (!this.isProduction) {
      console.debug(`🔍 ${this.formatMessage(LogLevel.DEBUG, message, context)}`, data);
    }
  }

  success(message: string, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      data,
      context
    };
    
    this.addToHistory(entry);
    
    if (!this.isProduction) {
      console.log(`✅ ${this.formatMessage(LogLevel.INFO, message, context)}`, data);
    }
  }

  // Métodos para obtener logs
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  getErrors(): LogEntry[] {
    return this.logs.filter(log => log.level === LogLevel.ERROR);
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Configuración dinámica
  setLogLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  // Para debugging en desarrollo
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Instancia singleton
export const logger = new Logger();

// Función helper para casos de migración gradual
export const safeLog = {
  error: (message: string, data?: any) => logger.error(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  debug: (message: string, data?: any) => logger.debug(message, data),
  success: (message: string, data?: any) => logger.success(message, data)
};