import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import './db/database';
import packagesRouter from './routes/packages';
import seedRouter from './routes/seed';
import chatRouter from './routes/chat';
import { errorHandler } from './middleware/errorHandler';
import { startScheduler } from './scheduler';
import { isMockMode } from './services/aftership';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/packages', packagesRouter);
app.use('/api/seed', seedRouter);
app.use('/api/chat', chatRouter);

app.use(errorHandler as express.ErrorRequestHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (isMockMode()) {
    console.log('[server] Running in MOCK mode — no AfterShip API calls');
  }
  startScheduler();
});
