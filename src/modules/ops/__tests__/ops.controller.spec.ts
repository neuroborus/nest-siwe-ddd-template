import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { OpsController } from '../ops.controller';

function createMockDataSource(healthy = true): Partial<DataSource> {
  return {
    query: healthy
      ? jest.fn().mockResolvedValue([{ '?column?': 1 }])
      : jest.fn().mockRejectedValue(new Error('connection refused')),
  };
}

describe('OpsController', () => {
  async function createApp(ds: Partial<DataSource>): Promise<INestApplication> {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpsController],
      providers: [{ provide: DataSource, useValue: ds }],
    }).compile();

    const app = module.createNestApplication();
    await app.init();
    return app;
  }

  it('GET /ops/health returns 200 with db=up when DB is reachable', async () => {
    const app = await createApp(createMockDataSource(true));
    const res = await request(app.getHttpServer()).get('/ops/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('up');
    expect(res.body.timestamp).toBeDefined();
    await app.close();
  });

  it('GET /ops/health returns 200 with db=down when DB is unreachable', async () => {
    const app = await createApp(createMockDataSource(false));
    const res = await request(app.getHttpServer()).get('/ops/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('down');
    await app.close();
  });
});
