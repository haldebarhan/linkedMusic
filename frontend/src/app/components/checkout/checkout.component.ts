import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthUser } from '../../shared/interfaces/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../auth/auth.service';
import { ApiResponse } from '../../shared/interfaces/response-formatter';
import { UserUpdateService } from '../../auth/user-update.service';
import { SweetAlert } from '../../helpers/sweet-alert';

interface PaymentMethod {
  id: string;
  name: string;
  image: string;
}

@Component({
  selector: 'app-checkout',
  imports: [CommonModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit {
  user$: Observable<AuthUser | null>;
  user: AuthUser | null = null;
  loading = true;
  processing = false;
  error: string | null = null;
  plan: any;
  selectedPaymentMethod: string | null = null;

  // Liste des méthodes de paiement avec chemins vers vos images
  paymentMethods: PaymentMethod[] = [
    {
      id: 'orange',
      name: 'Orange Money',
      image: 'assets/images/orange.png',
    },
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      image: 'assets/images/mtn.png',
    },
    {
      id: 'wave',
      name: 'Wave',
      image: 'assets/images/wave.png',
    },
    {
      id: 'moov',
      name: 'Moov Money',
      image: 'assets/images/moov.png',
    },
    {
      id: 'djamo',
      name: 'Djamo',
      image: 'assets/images/djamo.png',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService<any>,
    private auth: AuthService,
    private userUpdateService: UserUpdateService
  ) {
    this.user$ = this.auth.user$;
  }

  ngOnInit(): void {
    const planId = parseInt(this.route.snapshot.paramMap.get('id') as string);
    if (planId) {
      this.loadPlanDetails(planId);
      this.getCurrentUser();
    } else {
      this.error = 'Aucun plan sélectionné';
      this.loading = false;
    }
  }

  getCurrentUser() {
    this.auth.user$.subscribe((user) => {
      this.user = user;
    });
  }

  loadPlanDetails(planId: number) {
    this.loading = true;
    this.error = null;

    this.api.getOne('subscription-plans', planId).subscribe({
      next: (response) => {
        this.plan = response.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement du plan:', err);
        this.error =
          'Impossible de charger les détails du plan. Veuillez réessayer.';
        this.loading = false;
      },
    });
  }

  selectPaymentMethod(methodId: string) {
    this.selectedPaymentMethod = methodId;
  }

  getSelectedPaymentMethodName(): string {
    const method = this.paymentMethods.find(
      (m) => m.id === this.selectedPaymentMethod
    );
    return method ? method.name : '';
  }

  cancel() {
    this.router.navigate(['/pricing']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  getPeriodLabel(period: string): string {
    const labels: { [key: string]: string } = {
      FREE: 'Gratuit',
      MONTHLY: 'Mensuel',
      BIMONTHLY: 'Bimestriel',
      QUARTERLY: 'Trimestriel',
      SEMIANNUAL: 'Semestriel',
      ANNUAL: 'Annuel',
      CUSTOM: 'Personnalisé',
    };
    return labels[period] || period;
  }

  isFreePlan(): boolean {
    return this.plan?.period === 'FREE';
  }

  checkout() {
    if (!this.isFreePlan() && !this.selectedPaymentMethod) {
      SweetAlert.fire({
        title: 'Méthode de paiement requise',
        icon: 'warning',
        text: 'Veuillez sélectionner une méthode de paiement',
      });
      return;
    }

    this.processing = true;

    const payload = {
      planId: this.plan.id,
      paymentMethod: this.selectedPaymentMethod,
    };

    this.api.create('users/payments', payload).subscribe({
      next: (res) => {
        this.userUpdateService.notifyUserUpdate(res.data.user);
        if (res.data.returnUrl) {
          this.router.navigate([
            '/payments/callback/return',
            res.data.transactionId,
          ]);
        }
        if (res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl;
        }
      },
      error: (err) => {
        console.error(err);
        this.processing = false;
        SweetAlert.fire({
          title: err.data?.title || 'Erreur',
          icon: err.statusCode === 429 ? 'warning' : 'error',
          text: err.data?.message || 'Une erreur est survenue',
        });
      },
      complete: () => {
        this.processing = false;
      },
    });
  }
}
