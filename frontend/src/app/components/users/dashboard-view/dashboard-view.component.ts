import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { AuthService } from '../../../auth/auth.service';
import { Observable } from 'rxjs';
import { AuthUser } from '../../../shared/interfaces/auth';

export enum publicationStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

interface Publication {
  id: number;
  title: string;
  views: number;
  requests: number;
  status: publicationStatus;
  date: string;
}

interface Payment {
  id: number;
  transactionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  date: string;
  description: string;
}

interface Subscription {
  planName: string;
  planType: string;
  amount: number;
  currency: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  nextBillingDate?: Date;
  endDate?: Date;
  autoRenew?: boolean;
  features?: string[];
}

@Component({
  selector: 'app-dashboard-view',
  imports: [CommonModule],
  templateUrl: './dashboard-view.component.html',
  styleUrl: './dashboard-view.component.css',
})
export class DashboardViewComponent implements OnInit {
  subscription: Subscription | null = null;

  topPublications: Publication[] = [];
  recentPayments: Payment[] = [];
  requestSent: number = 0;
  totalViews: number = 0;
  requestReceived: number = 0;
  totalActive: number = 0;
  user$: Observable<AuthUser | null>;

  constructor(
    private router: Router,
    private api: ApiService<any>,
    private auth: AuthService
  ) {
    this.user$ = this.auth.user$;
  }

  ngOnInit(): void {
    this.user$.subscribe({
      next: (usr: any) => {
        const sub = usr?.subscriptions[0];
        if (sub) {
          this.subscription = {
            planName: sub.plan.name,
            planType: sub.plan.period,
            amount: sub.plan.priceCents,
            currency: sub.plan.currency || 'FCFA',
            startDate: sub.startAt,
            endDate: sub.endAt,
            status: sub.status,
          };
        }
      },
    });
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.api.getDashboard().subscribe({
      next: (res) => {
        const data = res.data;
        this.topPublications = data.publications;
        this.recentPayments = data.payments;
        this.totalActive = data.totalActive;
        this.totalViews = data.totalViews;
        this.requestReceived = data.requestReceived;
        this.requestSent = data.requestSent;
      },
      error: (err) => console.error(err),
    });
  }

  viewAllPublications(): void {
    this.router.navigate(['/profile/announcements']);
  }

  viewAllPayments(): void {
    this.router.navigate(['/user/payments']);
  }

  viewPublication(id: number): void {
    this.router.navigate(['/profile/announcements', id]);
  }

  renewSubscription(): void {
    this.router.navigate(['/user/subscription/renew']);
  }

  viewPlans(): void {
    this.router.navigate(['/pack/pricing-plan']);
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      completed: 'status-completed',
      pending: 'status-pending',
      failed: 'status-failed',
      Actif: 'status-active',
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      completed: 'Complété',
      pending: 'En attente',
      failed: 'Échoué',
      active: 'Actif',
      expired: 'Expiré',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  }
}
