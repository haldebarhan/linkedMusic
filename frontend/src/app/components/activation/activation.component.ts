import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
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
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.state = 'loading';
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');
    if (!token || !email) {
      this.state = 'error';
      return;
    }
    try {
      await this.auth.activateAccount(email, token).then(() => {
        this.state = 'success';
        this.startCooldown();
      });
    } catch (error) {
      this.state = 'error';
    }
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
