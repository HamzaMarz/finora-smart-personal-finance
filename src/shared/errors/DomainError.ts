// Base Domain Error
export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';
        Error.captureStackTrace(this, this.constructor);
    }
}

// Validation Error
export class ValidationError extends DomainError {
    constructor(
        message: string,
        public readonly field?: string
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}

// Not Found Error
export class NotFoundError extends DomainError {
    constructor(
        public readonly entityName: string,
        public readonly entityId: string
    ) {
        super(`${entityName} with ID ${entityId} not found`);
        this.name = 'NotFoundError';
    }
}

// Unauthorized Error
export class UnauthorizedError extends DomainError {
    constructor(message: string = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

// Business Rule Violation Error
export class BusinessRuleViolationError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'BusinessRuleViolationError';
    }
}

// External Service Error
export class ExternalServiceError extends DomainError {
    constructor(
        public readonly serviceName: string,
        message: string
    ) {
        super(`${serviceName}: ${message}`);
        this.name = 'ExternalServiceError';
    }
}
