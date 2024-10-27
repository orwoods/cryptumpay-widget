import fs from 'fs';
import path from 'path';
import { FastifyInstance } from 'fastify';

export const getIndex = (server: FastifyInstance) => {
  server.get('/widget.js', async (request, reply) => {
    const filePath = path.join(__dirname, '..', 'static', 'widget.js');
    const widget = fs.readFileSync(filePath, 'utf-8');

    reply.type('text/javascript').send(widget);
  });
};
