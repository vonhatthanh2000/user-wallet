import { NamingStrategy } from './src/common/typeorm/naming.strategy';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({
  path: `.env`,
});

export const connectionSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRE_HOST,
  port: parseInt(<string>process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [`${__dirname}/**/*.entity{.ts,.js}`],
  namingStrategy: new NamingStrategy(),
  migrationsTableName: '__migrations',
  migrations: ['./migrations/**/*.ts'],
  synchronize: false,
});
