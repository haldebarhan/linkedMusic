import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

interface UserData {
  name: string;
  email: string;
  avatar: string;
}

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  @Input() userData: UserData = {
    name: 'Bertha Bonner',
    email: 'berthabonner@gmail.com',
    avatar: 'https://i.pravatar.cc/150?img=12',
  };
  @Input() messageCount = 5;
  @Output() logout = new EventEmitter<void>();

  dropdownOpen = false;

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
  }

  onLogout(): void {
    this.logout.emit();
    this.closeDropdown();
  }
}
