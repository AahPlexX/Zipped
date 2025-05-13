
// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

// Add custom logging and diagnostics to the Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
  }).$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        const result = await query(args);
        const end = performance.now();
        const duration = end - start;
        
        // Only log slow queries in production (>100ms)
        if (process.env.NODE_ENV === 'production' && duration > 100) {
          console.warn(`Slow query detected: ${operation} on ${model} took ${duration.toFixed(2)}ms`);
        } 
        // Log all queries in development for debugging
        else if (process.env.NODE_ENV === 'development') {
          console.log(`Query: ${operation} on ${model} took ${duration.toFixed(2)}ms`);
        }
        
        return result;
      },
    },
  });
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: ReturnType<typeof prismaClientSingleton> };

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

// Handle graceful shutdowns for the Prisma Client
const handleShutdown = async () => {
  console.log('Disconnecting Prisma Client...');
  await prisma.$disconnect();
  console.log('Prisma Client disconnected');
  process.exit(0);
};

// Only register these handlers in non-production environments
// In production, the environment should handle shutdown signals
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Executes a database transaction with automatic retries
 * Useful for critical operations that need resilience against temporary failures
 * 
 * @param fn Function containing Prisma operations to execute in transaction
 * @param maxRetries Maximum number of retry attempts
 * @returns Result of the transaction
 */
export async function executeTransaction<T>(
  fn: (tx: typeof prisma) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await prisma.$transaction(fn);
    } catch (error: any) {
      retries++;
      
      // Only retry on specific error types that are temporary
      const isRetryable = 
        error.code === 'P1001' || // Connection error
        error.code === 'P1002' || // Timeout error
        error.code === 'P1008' || // Operation timeout
        error.code === 'P1017';   // Server closed connection
      
      if (!isRetryable || retries >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms...
      const delay = 100 * Math.pow(2, retries - 1);
      console.warn(`Retrying transaction after ${delay}ms (attempt ${retries} of ${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Helper to check the database connection status
 * Useful for health checks and startup validation
 * 
 * @returns Object with connection status and optional error
 */
export async function checkDatabaseConnection() {
  try {
    // Execute a simple query to check connection
    await prisma.$queryRaw`SELECT 1`;
    return { 
      connected: true, 
      error: null 
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export default prisma;

/* Developed by Luccas A E | 2025 */
