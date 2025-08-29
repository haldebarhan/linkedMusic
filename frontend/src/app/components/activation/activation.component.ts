import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AuthUser } from '../../shared/interfaces/auth';
import { environment } from '../../../environments/environment';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-activation',
  imports: [CommonModule],
  templateUrl: './activation.component.html',
  styleUrl: './activation.component.css',
})
export class ActivationComponent implements OnInit {
  state: 'loading' | 'success' | 'error' = 'loading';
  errorMsg = 'Lien invalide ou expiré.';
  cooldown = 5;
  private timerSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.state = 'loading';
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');
    if (!token || !email) {
      this.state = 'error';
      return;
    }

    this.http
      .post<{
        statusCode: number;
        timestamp: string;
        data: { accessToken: string; user: AuthUser };
      }>(`${environment.apiUrl}/auth/activate`, { token, email })
      .subscribe({
        next: (res) => {
          this.auth.setLogin(res.data.accessToken, res.data.user);
          this.state = 'success';
          this.startCooldown();
        },
        error: () => {
          this.state = 'error';
        },
      });
  }

  startCooldown(seconds: number = this.cooldown) {
    this.cooldown = seconds;
    this.timerSub?.unsubscribe();
    this.timerSub = interval(1000).subscribe(() => {
      this.cooldown = Math.max(0, this.cooldown - 1);
      if (this.cooldown === 0) {
        this.timerSub?.unsubscribe();
        this.router.navigate(['/home']);
      }
    });
  }
}
