import { Column, Entity, Index } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import type { PermissionKey } from '../../../common/enums/permission-key.js';

@Entity('permissions')
export class Permission extends AppBaseEntity {
  // `type: 'varchar'` is explicit rather than inferred, since `PermissionKey`
  // is a string-literal union (not a concrete class) — real tsc/ts-node
  // infer `String` for that via emitDecoratorMetadata, but esbuild-based
  // transpilers (Vite/Vitest, used by the e2e test suite) infer `Object`
  // instead, which TypeORM's postgres driver rejects outright. Found by
  // actually running the e2e suite, not just the unit tests.
  @Index({ unique: true })
  @Column({ type: 'varchar' })
  key!: PermissionKey;

  @Column()
  description!: string;
}
