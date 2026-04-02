import express from 'express';
import cors from 'cors';
import { runnerRouter } from './routes/runner';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api', runnerRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
