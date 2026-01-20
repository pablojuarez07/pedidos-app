import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomeComponent } from "./home/home.component";
import { CommonModule } from '@angular/common';
import { SocketService } from './services/socket';

@Component({
  selector: 'app-root',
  imports: [HomeComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  screen = 'home';
  title = 'ventas-front';

  constructor(private socketService: SocketService) {}

  ngOnInit() {
    this.socketService.connect();
  }
}
