import { PaymentProvider, PaymentProviderConfig, Transaction, TransactionStatus, WebhookPayload } from '../core/payment/PaymentProvider.interface';

export class CashProvider implements PaymentProvider {
    private config!: PaymentProviderConfig;

    initialize(config: PaymentProviderConfig): void {
        this.config = config;
    }

    async processPayment(transaction: Transaction): Promise<{
        success: boolean;
        status: TransactionStatus;
        payment_reference?: string;
        message?: string;
    }> {
        if (transaction.amount_received < transaction.amount_due) {
            return {
                success: false,
                status: 'Failed',
                message: 'Amount received is less than amount due'
            };
        }

        // Cash payments are immediately marked as Paid if enough cash is given.
        return {
            success: true,
            status: 'Paid',
            payment_reference: `CASH-${Date.now()}`
        };
    }

    async checkStatus(transaction: Transaction): Promise<{
        status: TransactionStatus;
    }> {
        // Cash transactions do not have an external status to check
        return {
            status: transaction.status
        };
    }

    async refund(transaction: Transaction, amount: number): Promise<{
        success: boolean;
        message?: string;
    }> {
        // Cash refunds require manual drawer updates (handled by CashManagementService),
        // so provider just approves it.
        return {
            success: true,
            message: 'Cash refund approved'
        };
    }

    async handleWebhook(payload: WebhookPayload): Promise<{
        success: boolean;
        message?: string;
    }> {
        // Cash payments do not have webhooks
        return {
            success: false,
            message: 'Webhooks not supported for Cash provider'
        };
    }
}
