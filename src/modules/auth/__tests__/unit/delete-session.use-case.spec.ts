import { Test, TestingModule } from '@nestjs/testing';
import { DeleteSessionUseCase } from '../../application/use-cases/delete-session.use-case';
import { SessionRepository } from '../../infrastructure/persistence';

describe('DeleteSessionUseCase', () => {
  let useCase: DeleteSessionUseCase;
  let sessionRepo: { deleteById: jest.Mock };

  beforeEach(async () => {
    sessionRepo = { deleteById: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteSessionUseCase, { provide: SessionRepository, useValue: sessionRepo }],
    }).compile();

    useCase = module.get(DeleteSessionUseCase);
  });

  it('deletes session by id', async () => {
    await useCase.execute('sess-42');
    expect(sessionRepo.deleteById).toHaveBeenCalledWith('sess-42');
  });

  it('does not throw when repository succeeds', async () => {
    await expect(useCase.execute('sess-1')).resolves.toBeUndefined();
  });

  it('propagates repository errors', async () => {
    sessionRepo.deleteById.mockRejectedValue(new Error('db error'));
    await expect(useCase.execute('sess-1')).rejects.toThrow('db error');
  });
});
