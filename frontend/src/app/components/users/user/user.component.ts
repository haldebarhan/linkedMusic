import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { Observable } from 'rxjs';
import { AuthUser } from '../../../shared/interfaces/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
})
export class UserComponent implements OnInit {
  usersOpen = true;
  user$: Observable<AuthUser | null>;
  show: boolean = false;

  constructor(private auth: AuthService) {
    this.user$ = this.auth.user$;
  }
  ngOnInit(): void {
    this.user$.subscribe({
      next: (usr: any) => {
        this.show = usr.provider === 'password';
      },
    });
  }

  onNavigate(action: string) {
    // branchement routage / modals selon ton app
    // console.log('navigate to', action);
  }
}
