export type TransactionStatus = 'Pending' | 'Paid' | 'Failed' | 'Expired' | 'Cancelled' | 'Refunded';

export interface Transaction {
    id: string;
    order_reference: string;
    amount_due: number;
    amount_received: number;
    change_given: number;
    status: TransactionStatus;
    payment_method_id: string;
    provider_transaction_id?: string;
    payment_reference?: string;
    created_at: Date;
    updated_at: Date;
}

export interface PaymentProviderConfig {
    id: string;
    name: string;
    type: string;
    api_credentials: Record<string, any>;
    environment: 'sandbox' | 'production';
}

export interface WebhookPayload {
    provider: string;
    rawBody: string;
    parsedBody: any;
    headers: Record<string, string>;
}

export interface PaymentProvider {
    /**
     * Initializes the provider with its configuration from the database.
     */
    initialize(config: PaymentProviderConfig): void;

    /**
     * Initiates a payment process.
     * For Cash: Validates amount received vs due.
     * For QRIS/Cards: Calls external API to create a payment intent.
     */
    processPayment(transaction: Transaction): Promise<{
        success: boolean;
        status: TransactionStatus;
        provider_transaction_id?: string;
        payment_reference?: string;
        metadata?: any;
        message?: string;
    }>;

    /**
     * Checks the current status of a transaction from the provider.
     */
    checkStatus(transaction: Transaction): Promise<{
        status: TransactionStatus;
        provider_transaction_id?: string;
    }>;

    /**
     * Refunds a transaction via the provider's API.
     */
    refund(transaction: Transaction, amount: number): Promise<{
        success: boolean;
        message?: string;
    }>;

    /**
     * Parses a webhook payload from the provider and updates the transaction.
     */
    handleWebhook(payload: WebhookPayload): Promise<{
        success: boolean;
        transaction_id?: string;
        status?: TransactionStatus;
        message?: string;
    }>;
}
