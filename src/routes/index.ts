import { FastifyInstance } from 'fastify';
import { getIndex } from './getIndex';

export const registerRoutes = (server: FastifyInstance) => {
  getIndex(server);
};
