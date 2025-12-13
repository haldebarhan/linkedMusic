import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
})
export class VerifyEmailComponent implements OnInit {
  email?: string;
  maskedEmail = '';
  adminMail = 'info@zikmuzik.com';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    let e = this.email;
    if (!e) e = this.route.snapshot.queryParamMap.get('email') || undefined;
    this.email = e;
    this.maskedEmail = e ? this.maskEmail(e) : '';
  }

  maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain || !user) return email;
    const maskedUser =
      user.length <= 2
        ? user[0] + '*'
        : user[0] +
          '*'.repeat(Math.max(1, user.length - 2)) +
          user[user.length - 1];
    return `${maskedUser}@${domain}`;
  }
}
