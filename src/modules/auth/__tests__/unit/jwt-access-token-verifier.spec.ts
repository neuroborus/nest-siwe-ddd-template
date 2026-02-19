import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtAccessTokenVerifier } from '../../infrastructure/jwt';

describe('JwtAccessTokenVerifier', () => {
  let verifier: JwtAccessTokenVerifier;
  let jwtService: { verifyAsync: jest.Mock };

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAccessTokenVerifier, { provide: JwtService, useValue: jwtService }],
    }).compile();

    verifier = module.get(JwtAccessTokenVerifier);
  });

  it('delegates to JwtService.verifyAsync', async () => {
    const payload = { sub: 'u1', ethAddress: '0xabc', sessionId: 's1' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const result = await verifier.verify('some.jwt.token');

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('some.jwt.token');
    expect(result).toEqual(payload);
  });

  it('propagates verification errors', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    await expect(verifier.verify('expired.token')).rejects.toThrow('jwt expired');
  });
});
