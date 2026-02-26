import { BadRequestException, Body, Controller, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { fileTypeFromBuffer } from 'file-type';

@Controller('productos')
export class ProductosController {
  constructor(private productosService: ProductosService) {}

  private isProd = process.env.NODE_ENV === 'production';

  // obtener productos
  @Get()
  getProductos(){
    return this.productosService.getProductos();
  }

  // añadir un producto
  @Post('add')
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage:
        process.env.NODE_ENV === 'production'
          ? memoryStorage()
          : diskStorage({
              destination: './uploads',
              filename: (req, file, cb) => {
                const unique =
                  Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, unique + extname(file.originalname));
              },
            }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Solo se permiten imágenes'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async addProducto(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateProductoDto,
  ) {
    if (!file) {
      throw new BadRequestException('Debe subir una imagen');
    }

    // Validación REAL del archivo (solo en producción o si hay buffer)
    if (this.isProd) {
      const type = await fileTypeFromBuffer(file.buffer);

      if (!type || !type.mime.startsWith('image/')) {
        throw new BadRequestException(
          'El archivo no es una imagen válida',
        );
      }
    }

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
