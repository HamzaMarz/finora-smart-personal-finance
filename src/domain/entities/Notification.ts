import { ValidationError } from '../../shared/errors/DomainError.js';

export type NotificationType = 'income' | 'expense' | 'saving' | 'investment' | 'budget' | 'system' | 'alert';

export interface NotificationProps {
    id: string;
    userId: string;
    type: NotificationType;
    category: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
}

/**
 * Domain Entity: Notification
 * Represents a user notification
 */
export class Notification {
    private constructor(private readonly props: NotificationProps) {
        this.validate();
    }

    static create(
        userId: string,
        type: NotificationType,
        category: string,
        title: string,
        message: string
    ): Notification {
        return new Notification({
            id: crypto.randomUUID(),
            userId,
            type,
            category,
            title,
            message,
            isRead: false,
            createdAt: new Date()
        });
    }

    // Factory methods for specific notification types
    static forIncomeCreated(userId: string, sourceName: string, amount: number, currency: string): Notification {
        return Notification.create(
            userId,
            'income',
            'income',
            'income_added_title',
            JSON.stringify({
                key: 'income_added_msg',
                params: { sourceName, amount: amount.toFixed(2), currency }
            })
        );
    }

    static forExpenseCreated(userId: string, category: string, amount: number, currency: string): Notification {
        return Notification.create(
            userId,
            'expense',
            'expense',
            'expense_added_title',
            JSON.stringify({
                key: 'expense_added_msg',
                params: { category, amount: amount.toFixed(2), currency }
            })
        );
    }

    static forInvestmentCreated(userId: string, assetName: string, assetType: string, amount: number, currency: string): Notification {
        return Notification.create(
            userId,
            'investment',
            'investment',
            'investment_added_notif_title',
            JSON.stringify({
                key: 'investment_added_notif_msg',
                params: { assetName, assetType, amount: amount.toFixed(2), currency }
            })
        );
    }

    static fromPersistence(props: NotificationProps): Notification {
        return new Notification(props);
    }

    private validate(): void {
        if (!this.props.title || this.props.title.trim().length === 0) {
            throw new ValidationError('Title is required', 'title');
        }
        if (!this.props.message || this.props.message.trim().length === 0) {
            throw new ValidationError('Message is required', 'message');
        }
    }

    // Getters
    get id(): string { return this.props.id; }
    get userId(): string { return this.props.userId; }
    get type(): NotificationType { return this.props.type; }
    get title(): string { return this.props.title; }
    get message(): string { return this.props.message; }
    get isRead(): boolean { return this.props.isRead; }
    get createdAt(): Date { return this.props.createdAt; }

    // Business methods
    markAsRead(): Notification {
        if (this.props.isRead) {
            return this; // Already read, return same instance
        }

        return new Notification({
            ...this.props,
            isRead: true
        });
    }

    toJSON() {
        return {
            id: this.props.id,
            userId: this.props.userId,
            type: this.props.type,
            category: this.props.category,
            title: this.props.title,
            message: this.props.message,
            isRead: this.props.isRead,
            createdAt: this.props.createdAt.toISOString()
        };
    }
}
