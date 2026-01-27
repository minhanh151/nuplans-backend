import { DataSource } from 'typeorm';
import config from './config/config';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: config.DB.HOST,
    port: config.DB.PORT,
    username: config.DB.USERNAME,
    password: config.DB.PASSWORD,
    database: config.DB.NAME,
    synchronize: false,
    logging: config.DB.LOGGING,
    entities: [
        __dirname + '/models/*.ts',
        __dirname + '/models/*.js'
    ],
    migrations: [
        __dirname + '/database/migrations/*.ts',
        __dirname + '/database/migrations/*.js'
    ],
    subscribers: [],
});

export default AppDataSource;
