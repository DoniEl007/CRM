import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration.js';
import { envValidationSchema } from './config/env.validation.js';
import { RedisModule } from './redis/redis.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { CrmModule } from './modules/crm/crm.module.js';
import { GroupsModule } from './modules/groups/groups.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from './common/guards/permissions.guard.js';
import { AppController } from './app.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),
    RedisModule,
    IdentityModule,
    CatalogModule,
    CrmModule,
    GroupsModule,
    AttendanceModule,
    PaymentsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
