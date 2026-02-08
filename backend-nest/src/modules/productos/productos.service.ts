import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SocketGateway } from '../../common/socket/socket.gateway';
import { DatabaseService } from '../../common/database/database.service';
import { SUPABASE } from 'src/common/supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';

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
        const result = await this.database.query("SELECT * FROM productos");
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

  async addProducto(body: CreateProductoDto, file: Express.Multer.File) {
    try {
      const { nombre, precio, descripcion, stock, categoria } = body;
  
      if (!file) {
        throw new BadRequestException('Falta la imagen');
      }
  
      let imageValue;
  
      if (this.isProd) {
        // 🟢 PRODUCCIÓN → Supabase
        const fileName = `${Date.now()}-${file.originalname}`;
  
        const { error } = await this.supabase.storage
          .from("productos")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype
          });
  
        if (error) throw error;
  
        const { data } = this.supabase.storage
          .from("productos")
          .getPublicUrl(fileName);
  
        imageValue = data.publicUrl;
  
      } else {
        // 🟡 DESARROLLO → carpeta local
        imageValue = file.filename;
      }
  
  
      // 3️⃣ Guardar producto con URL
      const sql = `
        INSERT INTO productos
        (nombre, precio, descripcion, stock, category, imagen)
        VALUES ($1, $2, $3, $4, $5, $6)
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
      throw new InternalServerErrorException('Error al agregar el Prodcuto');
    }
  }

  async getCategoria(categoria: string) {
    try {
  
      const result = await this.database.query(
        "SELECT * FROM productos WHERE category = $1",
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
}
