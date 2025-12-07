import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Subscription } from '../admin/pages/subscription-plans/subscription-plans.component';
import { ApiService } from '../../shared/services/api.service';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { AuthUser } from '../../shared/interfaces/auth';
import { Router } from '@angular/router';
import { userProfile } from '../users/user-profile/user-profile.component';

export enum PlanPeriod {
  FREE = 'FREE',
  MONTHLY = 'MONTHLY',
  BIMONTHLY = 'BIMONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  ANNUAL = 'ANNUAL',
  CUSTOM = 'CUSTOM',
}

@Component({
  selector: 'app-pricing-plan',
  imports: [CommonModule],
  templateUrl: './pricing-plan.component.html',
  styleUrl: './pricing-plan.component.css',
})
export class PricingPlanComponent implements OnInit {
  rows: any[] = [];
  user$: Observable<AuthUser | null>;
  isLoggedIn$: Observable<boolean>;

  completProfile: userProfile = {
    email: '',
    displayName: null,
    phone: null,
    lastName: null,
    firstName: null,
    country: null,
    zipCode: null,
    city: null,
  };
  constructor(
    private api: ApiService<any>,
    private auth: AuthService,
    private router: Router
  ) {
    this.user$ = this.auth.user$;
    this.isLoggedIn$ = this.auth.isLoggedIn$;
  }
  ngOnInit(): void {
    this.loadSubscriptionPlans();
  }

  loadSubscriptionPlans() {
    this.api
      .getAll({
        endpoint: 'subscription-plans',
      })
      .subscribe({
        next: (res) => {
          this.rows = this.sortPacksByPeriod(res.items.data);
        },
        error: (err) => console.error(err),
      });
  }

  sortPacksByPeriod(packs: Subscription[]): Subscription[] {
    const order = [
      PlanPeriod.FREE,
      PlanPeriod.MONTHLY,
      PlanPeriod.BIMONTHLY,
      PlanPeriod.QUARTERLY,
      PlanPeriod.SEMIANNUAL,
      PlanPeriod.ANNUAL,
      PlanPeriod.CUSTOM,
    ];

    return packs.sort(
      (a, b) =>
        order.indexOf(a.period as PlanPeriod) -
        order.indexOf(b.period as PlanPeriod)
    );
  }

  isFreePlan(plan: any): boolean {
    return plan.period === PlanPeriod.FREE;
  }

  isPopularPlan(plan: any): boolean {
    return plan.period === PlanPeriod.BIMONTHLY;
  }

  formatName(name: string): string {
    return name.replace('PACK', '').trim();
  }

  startPlanSubscription(plan: any) {
    const isAuthenticated = this.auth.snapshot.isAuthenticated;
    if (!isAuthenticated) {
      this.router.navigate(['/login'], {
        queryParams: {
          redirect: `/checkout/${plan.id}`,
        },
      });
      return;
    }
    this.router.navigate(['/checkout', plan.id]);
  }
}
