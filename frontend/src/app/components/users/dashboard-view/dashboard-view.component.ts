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

export interface Payment {
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
        const publications = data.publications as any[];
        const formatedPub = publications.map((pub) => {
          return { ...pub, requests: pub._count.contactRequests };
        });
        this.topPublications = formatedPub;
        this.recentPayments = data.payments || [];
        this.totalActive = data.totalActive || 0;
        this.totalViews = data.totalViews || 0;
        this.requestReceived = data.requestReceived || 0;
        this.requestSent = data.requestSent || 0;
      },
      error: (err) => console.error(err),
    });
  }

  viewAllPublications(): void {
    this.router.navigate(['/profile/announcements']);
  }

  viewAllPayments(): void {
    this.router.navigate(['/users/transactions']);
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

  goToPublicationDetails(id: number) {
    this.router.navigate(['/profile/announcements', id]);
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      SUCCEEDED: 'status-completed',
      PENDING: 'status-pending',
      FAILED: 'status-failed',
      Actif: 'status-active',
      PUBLISHED: 'status-completed',
    };
    return classes[status] || '';
  }

  getPublicationLabel(status: string) {
    const label: { [key: string]: string } = {
      PUBLISHED: 'Publié',
      DRAFT: 'Brouillon',
      ARCHIVED: 'Archivé',
      PENDING_APPROVAL: 'En attente',
    };
    return label[status] || status;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      SUCCEEDED: 'Complété',
      PENDING: 'En attente',
      FAILED: 'Échoué',
      active: 'Actif',
      expired: 'Expiré',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  }
}
