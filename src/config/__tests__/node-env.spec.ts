import { NodeEnv } from '../node-env.enum';

describe('NodeEnv', () => {
  it('has Dev, Stage, Prod values', () => {
    expect(NodeEnv.Dev).toBe('development');
    expect(NodeEnv.Stage).toBe('stage');
    expect(NodeEnv.Prod).toBe('production');
  });

  it('values match .env.example conventions', () => {
    const values = Object.values(NodeEnv);
    expect(values).toContain('development');
    expect(values).toContain('stage');
    expect(values).toContain('production');
    expect(values).toHaveLength(3);
  });
});
