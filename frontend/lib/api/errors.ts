export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, any>;
  requestId?: string;
}

export class NexusApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, any>;
  requestId?: string;

  constructor(status: number, errorDetail: ApiErrorDetail) {
    super(errorDetail.message || 'An API error occurred');
    this.name = 'NexusApiError';
    this.status = status;
    this.code = errorDetail.code || 'UNKNOWN_ERROR';
    this.details = errorDetail.details;
    this.requestId = errorDetail.requestId;
  }
}
