import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangeCierreDto } from './dto/change-cierre.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt-auth.guard';


@Controller('user')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Body() body: ChangePasswordDto) {
    return this.adminService.changePassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  changeEmail(@Body() body: ChangeEmailDto) {
    return this.adminService.changeEmail(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-cierre')
  changeCierre(@Body() body: ChangeCierreDto) {
    return this.adminService.changeCierre(body);
  }

  @Get('cierre-campania')
  getCierreCampania() {
    return this.adminService.getCierreCampania();
  }
  
  @Get('keep-alive')
  async keepAlive() {
    return this.adminService.keepAlive();
  }
}
