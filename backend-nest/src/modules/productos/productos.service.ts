import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SocketGateway } from '../../common/socket/socket.gateway';
import { DatabaseService } from '../../common/database/database.service';
import { SUPABASE } from 'src/common/supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { unlinkSync } from 'fs';

@Injectable()
export class ProductosService {
  constructor(
    private database: DatabaseService,
    private socketGateway: SocketGateway,
    @Inject(SUPABASE) private supabase: SupabaseClient
  ) {}

  private isProd = process.env.NODE_ENV === 'production';
  private back_url = process.env.BACK_URL || 'http://localhost:3000';

  async getProductos() {
    try {
        const result = await this.database.query("SELECT * FROM productos WHERE activo = true ORDER BY id DESC");
        const rows = result.rows
    
        // agregar URL de la imagen
        const productos = rows.map(p => ({
          ...p,
          imagen_url: this.isProd
            ? p.imagen
            : `${this.back_url}/uploads/${p.imagen}`
        }));
    
        return productos;
      } catch (error) {
        console.error("Error al obtener productos:", error);
        throw new InternalServerErrorException("Error al obtener productos");
      }
  }

  async addProducto(body: CreateProductoDto, file: any) {
    try {
      const { nombre, precio, descripcion, stock, categoria } = body;
  
      if (!file) {
        throw new BadRequestException('Debe subir una imagen.');
      }
  
      let imageValue;
  
      if (this.isProd) {
        // PRODUCCIÓN → Supabase
        // Validar tipo REAL
        const type = await fileTypeFromBuffer(file.buffer);

        if (!type || !type.mime.startsWith('image/')) {
          throw new BadRequestException('El archivo no es una imagen válida');
        }

        // Convertir SIEMPRE a JPEG real
        let convertedBuffer: Buffer;

        try {
          convertedBuffer = await sharp(file.buffer)
            .jpeg({ quality: 90 })
            .toBuffer();
        } catch {
          throw new BadRequestException(
            'La imagen está corrupta o dañada'
          );
        }

        const fileName = `${Date.now()}.jpg`;

        const { error } = await this.supabase.storage
          .from('productos')
          .upload(fileName, convertedBuffer, {
            contentType: 'image/jpeg',
          });

        if (error) throw new InternalServerErrorException('Error al subir imagen.');
  
        const { data } = this.supabase.storage
          .from("productos")
          .getPublicUrl(fileName);
  
        imageValue = data.publicUrl;
  
      } else {
        // 🟡 DESARROLLO → carpeta local
        const newFileName = `${Date.now()}.jpg`;
        const outputPath = `./uploads/${newFileName}`;

        try {
          await sharp(file.path)
            .jpeg({ quality: 90 })
            .toFile(outputPath);
        } catch {
          unlinkSync(file.path);
          throw new BadRequestException(
            'La imagen está corrupta o dañada'
          );
        }
        unlinkSync(file.path);
        imageValue = newFileName;
      }
  
      // 3️⃣ Guardar producto con URL
      const sql = `
        INSERT INTO productos
        (nombre, precio, descripcion, stock, category, imagen, activo)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING *
      `;
  
      const { rows } = await this.database.query(sql, [
        nombre,
        precio,
        descripcion,
        stock,
        categoria,
        imageValue
      ]);
  
      const nuevoProducto: Producto = rows[0];

      const productoFinal = {
        ...nuevoProducto,
        imagen_url: this.isProd
          ? nuevoProducto.imagen
          : `${this.back_url}/uploads/${nuevoProducto.imagen}`
      };
  
      // Emitir socket
      this.socketGateway.server.emit('nuevo_producto', productoFinal);
  
      return {
        message: "Producto creado correctamente",
        producto: nuevoProducto
      }
  
    } catch (error) {
      console.error("Error al agregar producto:", error);

      // NO pisar errores ya controlados
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Error al agregar el Prodcuto');
    }
  }

  async getCategoria(categoria: string) {
    try {
  
      const result = await this.database.query(
        "SELECT * FROM productos WHERE category = $1 AND activo = true ORDER BY id DESC",
        [categoria]
      );
  
      const rows = result.rows;
  
      // agregar URL de la imagen, igual que en la ruta principal
      const productos = rows.map(p => ({
        ...p,
        imagen_url: this.isProd
          ? p.imagen
          : `${this.back_url}/uploads/${p.imagen}`
      }));
  
      return productos;
  
    } catch (error) {
      console.error("Error:", error);
      throw new InternalServerErrorException("Error al traer productos por categoria");
    }
  }

  async editarProducto(id: number, body: UpdateProductoDto) {
    const { nombre, descripcion, precio, stock, category } = body;
  
    try {
      const { rows } = await this.database.query(
        `
        UPDATE productos
        SET
          nombre = COALESCE($1, nombre),
          descripcion = COALESCE($2, descripcion),
          precio = COALESCE($3, precio),
          stock = COALESCE($4, stock),
          category = COALESCE($5, category)
        WHERE id = $6
        RETURNING *
        `,
        [nombre, descripcion, precio, stock, category, id]
      );
  
      const producto = rows[0];
      const productoConImagen = {
        ...producto,
        imagen_url: this.isProd
          ? producto.imagen
          : `${this.back_url}/uploads/${producto.imagen}`
      };
  
      this.socketGateway.server.emit("producto_actualizado", productoConImagen);
  
      return productoConImagen;
  
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al actualizar producto');
    }
  }

  async eliminarProducto(id: number) {
    try {
      const result = await this.database.query(
        "SELECT * FROM productos WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        throw new BadRequestException('Producto no encontrado');
      }

      const usado = await this.database.query(`
        SELECT 1
        FROM pedido_detalle
        WHERE producto_id = $1
        LIMIT 1
      `, [id]);

      if (usado.rowCount > 0) {
        await this.database.query(`
          UPDATE productos
          SET activo = false
          WHERE id = $1
        `, [id]);
      } else {
        await this.database.query(`
          DELETE FROM productos
          WHERE id = $1
        `, [id]);
      }

      this.socketGateway.server.emit("producto_eliminado", { id });

      return { ok: true };

    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      console.error(error);
      throw new InternalServerErrorException('Error al eliminar producto');
    }
  }
}
