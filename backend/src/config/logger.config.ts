// logger.config.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './app.config';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const transports: winston.transport[] = [
  new DailyRotateFile({
    filename: `${config.logging.dir}/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d',
    maxSize: '20m',
    format: combine(timestamp(), errors({ stack: true }), json())
  }),
  new DailyRotateFile({
    filename: `${config.logging.dir}/combined-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    maxSize: '20m',
    format: combine(timestamp(), errors({ stack: true }), json())
  })
];

if (config.nodeEnv !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: combine(colorize(), simple())
    })
  );
}

export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: `${config.logging.dir}/exceptions-%DATE%.log`,
      datePattern: 'YYYY-MM-DD'
    })
  ]
});
