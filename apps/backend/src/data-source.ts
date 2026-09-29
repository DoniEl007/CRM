import 'dotenv/config';
import { DataSource } from 'typeorm';

// Standalone DataSource for the TypeORM CLI (migration:generate/run/revert).
// Separate from AppModule's TypeOrmModule.forRootAsync, which the running
// app uses and which still allows `synchronize` outside production for fast
// iteration — migrations are the production-safe path once the schema
// stabilizes, and this file is what actually applies them.
//
// Dual-mode on purpose: `npm run migration:generate/run` load this file via
// ts-node-esm against TypeScript source (import.meta.url ends in ".ts"), but
// the production image has no ts-node — it runs migrations with the plain
// `typeorm` CLI against the compiled `dist/data-source.js` instead
// (import.meta.url then ends in ".js"). Matching the glob extension to
// however this file itself was loaded lets one file serve both without
// hand-maintaining two copies.
const ext = import.meta.url.endsWith('.ts') ? 'ts' : 'js';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [`${import.meta.dirname}/**/*.entity.${ext}`],
  migrations: [`${import.meta.dirname}/migrations/*.${ext}`],
  synchronize: false,
});
