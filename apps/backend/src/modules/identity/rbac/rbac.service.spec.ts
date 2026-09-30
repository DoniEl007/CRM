import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../../common/enums/role.enum.js';
import { RbacService } from './rbac.service.js';

function makeRepoMock() {
  return {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneByOrFail: vi.fn(),
    create: vi.fn((x) => x),
    save: vi.fn((x) => x),
  };
}

function makeRedisMock() {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    _store: store,
  };
}

describe('RbacService', () => {
  let permissionsRepo: ReturnType<typeof makeRepoMock>;
  let rolePermissionsRepo: ReturnType<typeof makeRepoMock>;
  let redis: ReturnType<typeof makeRedisMock>;
  let service: RbacService;

  beforeEach(() => {
    permissionsRepo = makeRepoMock();
    rolePermissionsRepo = makeRepoMock();
    redis = makeRedisMock();
    service = new RbacService(permissionsRepo as any, rolePermissionsRepo as any, redis as any);
  });

  it('always grants Full Administrator, without touching the DB or cache', async () => {
    const granted = await service.isGranted(Role.FULL_ADMIN, 'system.rbac_manage');
    expect(granted).toBe(true);
    expect(rolePermissionsRepo.find).not.toHaveBeenCalled();
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('denies a role with no matching grant row', async () => {
    rolePermissionsRepo.find.mockResolvedValue([]);
    const granted = await service.isGranted(Role.CEO, 'crm.manage');
    expect(granted).toBe(false);
  });

  it('grants a role with a matching, granted=true row', async () => {
    rolePermissionsRepo.find.mockResolvedValue([
      { role: Role.ADMIN_STAFF, permission: { key: 'payments.manage' } },
    ]);
    const granted = await service.isGranted(Role.ADMIN_STAFF, 'payments.manage');
    expect(granted).toBe(true);
  });

  it('caches the grant set in Redis and does not re-query on the next call', async () => {
    rolePermissionsRepo.find.mockResolvedValue([{ role: Role.TEACHER, permission: { key: 'chat.access' } }]);

    await service.isGranted(Role.TEACHER, 'chat.access');
    await service.isGranted(Role.TEACHER, 'chat.access');

    expect(rolePermissionsRepo.find).toHaveBeenCalledTimes(1);
  });

  it('setGrant invalidates the cache for that role', async () => {
    permissionsRepo.findOneByOrFail.mockResolvedValue({ id: 'perm-1', key: 'chat.access' });
    rolePermissionsRepo.findOne.mockResolvedValue(null);

    await service.setGrant(Role.STUDENT, 'chat.access', true);

    expect(redis.del).toHaveBeenCalledWith('rbac:role-permissions:STUDENT');
  });

  it('getMatrix marks Full Administrator true for every key regardless of stored rows', async () => {
    rolePermissionsRepo.find.mockResolvedValue([]);
    const matrix = await service.getMatrix();
    for (const key of Object.keys(matrix[Role.FULL_ADMIN])) {
      expect(matrix[Role.FULL_ADMIN][key as keyof (typeof matrix)[Role.FULL_ADMIN]]).toBe(true);
    }
  });
});
