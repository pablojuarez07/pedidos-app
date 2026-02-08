import { Injectable, BadRequestException, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SocketGateway } from '../../common/socket/socket.gateway';
import { DatabaseService } from '../../common/database/database.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangeCierreDto } from './dto/change-cierre.dto';


@Injectable()
export class AdminService {
  constructor(
    private database: DatabaseService,   // 👈 ESTO
    private socketGateway: SocketGateway
  ) {}

  async login(body: LoginAdminDto) {
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestException('Faltan datos');
    }

    const result = await this.database.query(
      'SELECT * FROM admin WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const admin = result.rows[0];
    const coincide = await bcrypt.compare(password, admin.password);

    if (!coincide) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    return {
      message: 'Login correcto',
      admin: { id: admin.id, email: admin.email },
    };
  }

  async changePassword(body: ChangePasswordDto) {
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      throw new BadRequestException('Faltan datos');
    }

    const result = await this.database.query('SELECT password FROM admin LIMIT 1');

    const coincide = await bcrypt.compare(oldPassword, result.rows[0].password);
    if (!coincide) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.database.query('UPDATE admin SET password = $1', [hashed]);

    return { ok: true, message: 'Contraseña actualizada' };
  }

  async changeEmail(body: ChangeEmailDto) {
    const { email } = body;
    if (!email) throw new BadRequestException('Email requerido');

    try {
      await this.database.query('UPDATE admin SET email = $1', [email]);
      return { ok: true, message: 'Email actualizado' };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('Email ya en uso');
      }
      throw new InternalServerErrorException();
    }
  }

  async changeCierre(body: ChangeCierreDto) {
    const { cierreCampania } = body;
    if (!cierreCampania) throw new BadRequestException('Fecha requerida');

    await this.database.query('UPDATE admin SET cierre_campania = $1', [cierreCampania]);

    // emitir por websocket
    this.socketGateway.server.emit('nueva_fecha', cierreCampania);

    return { ok: true, message: 'Fecha de cierre actualizada' };
  }

  async getAdmin() {
    const result = await this.database.query(
      'SELECT email, cierre_campania FROM admin LIMIT 1',
    );
    return result.rows[0];
  }
}
