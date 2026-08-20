"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentFactory = void 0;
const CashProvider_1 = require("../../providers/CashProvider");
const QrisProvider_1 = require("../../providers/QrisProvider");
class PaymentFactory {
    static getProvider(config) {
        let provider;
        switch (config.type.toLowerCase()) {
            case 'cash':
                provider = new CashProvider_1.CashProvider();
                break;
            case 'qris':
                provider = new QrisProvider_1.QrisProvider();
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
exports.PaymentFactory = PaymentFactory;
