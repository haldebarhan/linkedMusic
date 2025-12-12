import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';

interface Transaction {
  amount: number;
  createdAt: string;
  currency: string;
  id: number;
  planId: number;
  provider: string;
  purpose: string;
  reference: string;
  status: string;
  updatedAt: string;
  userId: number;
}

@Component({
  selector: 'app-payment-return',
  imports: [CommonModule],
  templateUrl: './payment-return.component.html',
  styleUrl: './payment-return.component.css',
})
export class PaymentReturnComponent implements OnInit {
  transactionId: string | null = null;
  transaction: Transaction | null = null;
  verificationError: string | null = null;
  isVerifying = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly api: ApiService<any>
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.transactionId = params.get('reference');
      if (this.transactionId) {
        this.verifyTransaction(this.transactionId);
      }
    });
  }

  verifyTransaction(transactionId: string) {
    this.isVerifying = true;
    this.verificationError = null;
    this.api.getOne('users/payments', transactionId).subscribe({
      next: (res) => {
        this.isVerifying = false;
        this.transaction = res.data;
      },
      error: (err) => console.error(err),
    });
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  retryTransactionVerification() {
    if (this.transactionId) this.verifyTransaction(this.transactionId);
    else return;
  }

  contactSupport() {
    this.router.navigate(['/support']);
  }
}
