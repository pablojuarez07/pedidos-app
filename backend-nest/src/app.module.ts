import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './common/logger/logger.middleware';
import { AdminModule } from './modules/admin/admin.module';
import { DatabaseModule } from './common/database/database.module';
import { SocketGateway } from './common/socket/socket.gateway';
import { ProductosModule } from './modules/productos/productos.module';
import { SocketModule } from './common/socket/socket.module';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './common/supabase/supabase.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AdminModule, 
    DatabaseModule, 
    ProductosModule, 
    SocketModule, SupabaseModule, PedidosModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
