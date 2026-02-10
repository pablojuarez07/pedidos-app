import { Body, Controller, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Controller('productos')
export class ProductosController {
  constructor(private productosService: ProductosService) {}

  // obtener productos
  @Get()
  getProductos(){
    return this.productosService.getProductos();
  }

  // añadir un producto
  @Post('add')
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: './uploads', // carpeta
        filename: (req, file, cb) => {
          const unique = Date.now() + extname(file.originalname);
          cb(null, unique);
        }
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new Error('Solo imágenes'), false);
        }
        cb(null, true);
      }
    }),
  )
  addProducto(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateProductoDto
  ){
    return this.productosService.addProducto(body, file);
  }

  // Traer Productos por categoria
  @Get('categoria/:categoria')
  getCategoria(@Param('categoria') categoria: string){
    return this.productosService.getCategoria(categoria);
  }

  // Editar Producto
  @Put('edit/:id')
  editarProducto(@Param('id') id: string, @Body() body: UpdateProductoDto){
    return this.productosService.editarProducto(Number(id), body);
  }
}
