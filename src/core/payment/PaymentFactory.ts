import { PaymentProvider, PaymentProviderConfig } from './PaymentProvider.interface';
import { CashProvider } from '../../providers/CashProvider';
import { QrisProvider } from '../../providers/QrisProvider';

export class PaymentFactory {
    static getProvider(config: PaymentProviderConfig): PaymentProvider {
        let provider: PaymentProvider;

        switch (config.type.toLowerCase()) {
            case 'cash':
                provider = new CashProvider();
                break;
            case 'qris':
                provider = new QrisProvider();
                break;
            // case 'stripe':
            //     provider = new StripeProvider();
            //     break;
            default:
                throw new Error(`Unsupported payment provider type: ${config.type}`);
        }

        provider.initialize(config);
        return provider;
    }
}
