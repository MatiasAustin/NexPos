import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './controllers/ApiController';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'NexPos Payment System API is running' });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`NexPos API Server listening on port ${port}`);
    });
}

export default app;
