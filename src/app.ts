import path from 'path';
import { fastify, FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { registerRoutes } from './routes';

const start = async (server: FastifyInstance) => {
  try {
    await server.register(fastifyStatic, {
      root: path.join(__dirname, 'static'),
      prefix: '/static/',
    });

    await server.listen({ port: 5551 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

const server = fastify({ logger: true });

registerRoutes(server);
start(server);
