import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { DatabaseModule } from 'shared/database/database.module';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from 'config/database.config';
import { Role, User } from './user.entity';
import { UserExistsException } from './exceptions/user-exists.exception';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

describe('UserService 2', () => {
  let module: TestingModule;
  let em: EntityManager;
  let service: UserService;
  let postgresContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer().start();
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [databaseConfig] }),
        DatabaseModule.forRoot({
          allowGlobalContext: true,
          debug: false,
          host: postgresContainer.getHost(),
          port: postgresContainer.getPort(),
          dbName: postgresContainer.getDatabase(),
          user: postgresContainer.getUsername(),
          password: postgresContainer.getPassword(),
        }),
        MikroOrmModule.forFeature([User]),
      ],
      controllers: [],
      providers: [UserService],
    }).compile();
    em = module.get(EntityManager);
    service = module.get(UserService);
    const orm = module.get(MikroORM);
    await orm.getMigrator().up();
  });

  beforeEach(async () => {
    const orm = module.get(MikroORM);
    const generator = orm.getSchemaGenerator();
    await generator.clearDatabase();
  });

  afterAll(async () => {
    await module.close();
    await postgresContainer.stop();
  });

  it('createUser should create a new user 2', async () => {
    const dto = {
      email: 'test@example.org',
      role: Role.USER,
      firstName: 'first',
      lastName: 'last',
    };

    await service.createUser(dto);

    const dbUser = await em.fork().findOne(User, { email: dto.email });

    expect(dbUser).toHaveProperty('id');
    expect(dbUser).toMatchObject(dto);
  });

  it('createUser should thrown an error if user already exists 2', async () => {
    const dto = {
      email: 'test@example.org',
      role: Role.USER,
      firstName: 'first',
      lastName: 'last',
    };
    await service.createUser(dto);

    expect(service.createUser(dto)).rejects.toThrow(UserExistsException);
  });
});
