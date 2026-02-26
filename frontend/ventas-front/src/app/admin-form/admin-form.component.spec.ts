import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AdminFormComponent } from './admin-form.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import api from '../services/api';

describe('AdminFormComponent', () => {
  let component: AdminFormComponent;
  let fixture: ComponentFixture<AdminFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFormComponent],
      providers: [provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  // -----------------------------
  // 🔹 FORM
  // -----------------------------

  it('form debería iniciar inválido', () => {
    expect(component.admin_form().invalid).toBeTrue();
  });

  it('form debería ser válido con datos correctos', () => {
    component.admin_form().patchValue({
      email: 'admin@test.com',
      password: '12345678'
    });

    expect(component.admin_form().valid).toBeTrue();
  });

  // -----------------------------
  // 🔹 togglePassword
  // -----------------------------

  it('togglePassword debería cambiar showPassword', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePassword();
    expect(component.showPassword).toBeTrue();
  });

  it('botón toggle debería llamar togglePassword()', () => {
    spyOn(component, 'togglePassword');
    const btn = fixture.debugElement.query(By.css('.toggle-password'));
    btn.triggerEventHandler('click');
    expect(component.togglePassword).toHaveBeenCalled();
  });

  // -----------------------------
  // 🔹 LOGIN SUCCESS
  // -----------------------------

  it('login debería llamar API y emitir eventos si es exitoso', async () => {
    spyOn(api, 'post').and.resolveTo({} as any);
    spyOn(component.close, 'emit');
    spyOn(component.logeado, 'emit');

    component.admin_form().patchValue({
      email: 'admin@test.com',
      password: '12345678'
    });

    await component.login();

    expect(api.post).toHaveBeenCalledWith('/user/login', {
      email: 'admin@test.com',
      password: '12345678'
    });

    expect(component.close.emit).toHaveBeenCalled();
    expect(component.logeado.emit).toHaveBeenCalled();
  });

  // -----------------------------
  // 🔹 LOGIN ERROR
  // -----------------------------

  it('login NO debería emitir eventos si falla', async () => {
    spyOn(api, 'post').and.rejectWith(new Error('Credenciales inválidas'));
    spyOn(component.close, 'emit');
    spyOn(component.logeado, 'emit');

    component.admin_form().patchValue({
      email: 'admin@test.com',
      password: '12345678'
    });

    await component.login();

    expect(component.close.emit).not.toHaveBeenCalled();
    expect(component.logeado.emit).not.toHaveBeenCalled();
  });

  // -----------------------------
  // 🔹 CERRAR
  // -----------------------------

  it('cerrar debería emitir close después de 200ms', fakeAsync(() => {
    spyOn(component.close, 'emit');
    component.cerrar();
    tick(200);
    expect(component.close.emit).toHaveBeenCalled();
  }));

  it('botón cerrar del HTML debería llamar cerrar()', () => {
    spyOn(component, 'cerrar');
    const btn = fixture.debugElement.query(By.css('.cerrar_btn'));
    btn.triggerEventHandler('click');
    expect(component.cerrar).toHaveBeenCalled();
  });
});
