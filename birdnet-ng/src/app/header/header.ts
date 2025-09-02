import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  currentTime: Date = new Date();
  private intervalId: any;

  // ngOnInit(): void {
  //   this.intervalId = setInterval(() => {
  //     this.currentTime = new Date();
  //   }, 5000);
  // }

  // ngOnDestroy(): void {
  //   if (this.intervalId) {
  //     clearInterval(this.intervalId);
  //   }
  // }
}
