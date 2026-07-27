import pino from 'pino';

const level = process.env.LOG_LEVEL ?? 'info';

/**
 * Shared structured logger (Pino). Pretty-prints in a TTY, JSON otherwise so
 * output can be piped to files or log processors.
 */
export const logger = pino({
  level,
  transport: process.stdout.isTTY
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      }
    : undefined,
});

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
