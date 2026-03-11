import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';

import authRoutes        from './routes/auth';
import productRoutes     from './routes/products';
import printRecordRoutes from './routes/printRecords';

const app = Fastify({ logger: true });

// Plugins
app.register(cors, { origin: true });
app.register(multipart);

// Routes
app.register(authRoutes,        { prefix: '/api/auth' });
app.register(productRoutes,     { prefix: '/api/products' });
app.register(printRecordRoutes, { prefix: '/api/print-records' });

// Health check
app.get('/health', async () => ({ status: 'ok' }));

// Start
const PORT = Number(process.env.PORT) || 3000;
app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
