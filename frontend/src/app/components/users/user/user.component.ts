import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { Observable, Subscription } from 'rxjs';
import { AuthUser } from '../../../shared/interfaces/auth';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../../shared/services/socket.service';

@Component({
  selector: 'app-user',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
})
export class UserComponent implements OnInit, OnDestroy {
  usersOpen = true;
  user$: Observable<AuthUser | null>;
  show: boolean = false;
  unread = 0;
  isSidebarOpen = false;
  private sub?: Subscription;

  constructor(
    private auth: AuthService,
    private socketService: SocketService,
    private router: Router
  ) {
    this.user$ = this.auth.user$;
  }
  ngOnInit(): void {
    this.sub = this.socketService.unreadCount$().subscribe((n) => {
      this.unread = n;
    });
    this.user$.subscribe({
      next: (usr: any) => {
        this.show = usr?.provider === 'password';
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
