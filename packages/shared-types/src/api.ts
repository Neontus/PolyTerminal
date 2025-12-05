/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
  timestamp: Date;
}

/**
 * WebSocket message types
 */
export type WsMessageType =
  | 'market_update'
  | 'signal_published'
  | 'signal_purchased'
  | 'signal_resolved'
  | 'price_update';

/**
 * WebSocket message
 */
export interface WsMessage<T = any> {
  type: WsMessageType;
  data: T;
  timestamp: Date;
}

/**
 * API error codes
 */
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
}
