"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const ApiController_1 = __importDefault(require("./controllers/ApiController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', ApiController_1.default);
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to NexPos API',
        version: '1.0.0',
        docs: 'API is running. Use /api/payments/... for endpoints.'
    });
});
app.get('/health', (req, res) => {
    res.json({ status: 'NexPos Payment System API is running' });
});
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`NexPos API Server listening on port ${port}`);
    });
}
exports.default = app;
