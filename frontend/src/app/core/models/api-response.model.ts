export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
  timestamp: string;
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CursorPagedResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}
