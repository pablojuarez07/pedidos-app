import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminService } from 'src/modules/admin/admin.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private adminService: AdminService,
  ) {}

  async login(email: string, password: string) {
    // Traemos la única fila
    const admin = await this.adminService.getAdmin();

    if (!admin) {
      throw new UnauthorizedException('Admin no configurado');
    }

    // Verificamos email
    if (email !== admin.email) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Verificamos password
    const passwordMatch = await bcrypt.compare(
      password,
      admin.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}