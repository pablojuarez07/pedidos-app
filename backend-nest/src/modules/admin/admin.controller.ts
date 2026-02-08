import { Controller, Post, Get, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangeCierreDto } from './dto/change-cierre.dto';


@Controller('user')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('login')
  login(@Body() body: LoginAdminDto) {
    return this.adminService.login(body);
  }

  @Post('change-password')
  changePassword(@Body() body: ChangePasswordDto) {
    return this.adminService.changePassword(body);
  }

  @Post('change-email')
  changeEmail(@Body() body: ChangeEmailDto) {
    return this.adminService.changeEmail(body);
  }

  @Post('change-cierre')
  changeCierre(@Body() body: ChangeCierreDto) {
    return this.adminService.changeCierre(body);
  }

  @Get('admin')
  getAdmin() {
    return this.adminService.getAdmin();
  }
}
