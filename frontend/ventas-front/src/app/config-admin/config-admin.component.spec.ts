import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfigAdminComponent } from './config-admin.component';
import api from '../services/api';

describe('ConfigAdminComponent', () => {
  let component: ConfigAdminComponent;
  let fixture: ComponentFixture<ConfigAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigAdminComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  // ================= PASSWORD =================

  it('NO debería cambiar password si el form es inválido', async () => {
    const spy = spyOn(api, 'post');

    await component.cambiarPassword();

    expect(spy).not.toHaveBeenCalled();
    expect(component.passwordMsg).toContain('Completá');
  });

  it('debería cambiar password si el form es válido', async () => {
    spyOn(api, 'post').and.resolveTo({});

    component.passwordForm.setValue({
      oldPassword: '12345678',
      newPassword: '87654321'
    });

    await component.cambiarPassword();

    expect(api.post).toHaveBeenCalledWith('/user/change-password', {
      oldPassword: '12345678',
      newPassword: '87654321'
    });

    expect(component.passwordMsg).toContain('actualizada');
    expect(component.passwordForm.value.oldPassword).toBeNull(); // porque reset()
  });

  it('debería mostrar error si falla cambiar password', async () => {
    spyOn(api, 'post').and.rejectWith({
      response: { data: { error: 'Error backend' } }
    });

    component.passwordForm.setValue({
      oldPassword: '12345678',
      newPassword: '87654321'
    });

    await component.cambiarPassword();

    expect(component.passwordMsg).toBe('Error backend');
  });

  // ================= EMAIL =================

  it('NO debería cambiar email si el form es inválido', async () => {
    const spy = spyOn(api, 'post');

    await component.cambiarEmail();

    expect(spy).not.toHaveBeenCalled();
    expect(component.emailMsg).toContain('email válido');
  });

  it('debería cambiar email si el form es válido', async () => {
    spyOn(api, 'post').and.resolveTo({});

    component.emailForm.setValue({ email: 'test@mail.com' });

    await component.cambiarEmail();

    expect(api.post).toHaveBeenCalledWith('/user/change-email', {
      email: 'test@mail.com'
    });

    expect(component.emailMsg).toContain('actualizado');
  });

  // ================= FECHA CIERRE =================

  it('NO debería cambiar fecha cierre si form inválido', async () => {
    const spy = spyOn(api, 'post');

    await component.cambiarFechaCierre();

    expect(spy).not.toHaveBeenCalled();
    expect(component.cierreMsg).toContain('Seleccioná');
  });

  it('debería cambiar fecha cierre si form válido', async () => {
    spyOn(api, 'post').and.resolveTo({});

    component.cierreForm.setValue({ fechaCierre: '2026-02-10' });

    await component.cambiarFechaCierre();

    expect(api.post).toHaveBeenCalledWith('/user/change-cierre', {
      cierreCampania: '2026-02-10'
    });

    expect(component.cierreMsg).toContain('actualizada');
  });
});
