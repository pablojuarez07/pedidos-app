import { Module } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { SocketModule } from 'src/common/socket/socket.module';
import { SupabaseModule } from 'src/common/supabase/supabase.module';

@Module({
  imports: [SocketModule, SupabaseModule],
  providers: [ProductosService],
  controllers: [ProductosController]
})
export class ProductosModule {}
