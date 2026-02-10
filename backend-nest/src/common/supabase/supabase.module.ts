import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE = 'SUPABASE_CLIENT';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SUPABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return createClient(
          config.get<string>('SUPABASE_URL')!,
          config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
        );
      },
    },
  ],
  exports: [SUPABASE],
})
export class SupabaseModule {}
