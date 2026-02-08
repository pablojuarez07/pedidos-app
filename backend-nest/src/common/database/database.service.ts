import { Injectable, OnModuleInit } 
from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private pool: Pool;

  onModuleInit() {
    const isProduction = process.env.NODE_ENV === 'production';

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    });

    console.log('🟢 Base de datos conectada');
  }

  query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  getClient() {
    return this.pool.connect();
  }
}
