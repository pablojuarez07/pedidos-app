import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import { SocketService } from './services/socket';

describe('AppComponent', () => {
  let socketServiceMock: jasmine.SpyObj<SocketService>;

  beforeEach(async () => {
    socketServiceMock = jasmine.createSpyObj('SocketService', [
      'connect',
      'listen',
      'emit',
      'disconnect'
    ]);

    socketServiceMock.listen.and.returnValue(of());

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: SocketService, useValue: socketServiceMock },
        provideNoopAnimations()
      ],
      schemas: [NO_ERRORS_SCHEMA] // 🔥 CLAVE
    }).compileComponents();
  });

  it('debería crearse el componente', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debería llamar connect al iniciar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(socketServiceMock.connect).toHaveBeenCalled();
  });

  it('debería renderizar app-home cuando corresponde', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-home')).not.toBeNull();
  });
});
