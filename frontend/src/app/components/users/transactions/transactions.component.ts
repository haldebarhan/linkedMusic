import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  Payment,
  PaymentStatus,
} from '../dashboard-view/dashboard-view.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../shared/services/api.service';
import { BehaviorSubject, Subject, Subscription, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';

type SortBy = 'date' | 'amount';
type SortOrder = 'asc' | 'desc';

interface TransactionFilters {
  status: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  page: number;
  limit: number;
}

@Component({
  selector: 'app-transactions',
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css',
})
export class TransactionsComponent implements OnInit, OnDestroy {
  allPayments: any[] = [];
  filteredPayments: any[] = [];

  // UI state (binds)
  selectedStatus: string = 'all';
  searchQuery: string = '';
  sortBy: SortBy = 'date';
  sortOrder: SortOrder = 'desc';
  currentPage: number = 1;
  limit: number = 10;

  // Meta
  totalPages: number = 1;
  totalItems: number = 0;

  // Stats locales (sur l’échantillon renvoyé ou via un endpoint dédié)
  totalAmount: number = 0;
  successfulCount: number = 0;
  pendingCount: number = 0;
  failedCount: number = 0;

  loading = true;

  // Détail
  selectedPayment: any | null = null;
  showDetailModal = false;

  statusOptions = [
    { value: 'ALL', label: 'Tous les statuts' },
    { value: 'SUCCEEDED', label: 'Réussi' },
    { value: 'PENDING', label: 'En attente' },
    { value: 'FAILED', label: 'Échoué' },
    { value: 'REFUNDED', label: 'Remboursé' },
  ];

  // ---- RxJS
  private filters$ = new BehaviorSubject<TransactionFilters>({
    status: this.selectedStatus,
    sortBy: this.sortBy,
    sortOrder: this.sortOrder,
    page: this.currentPage,
    limit: this.limit,
  });

  private sub = new Subscription();

  constructor(private api: ApiService<any>, private router: Router) {}

  ngOnInit(): void {
    const dataSub = this.filters$
      .pipe(
        tap(() => (this.loading = true)),
        switchMap((f) =>
          this.api.getUserTransactions({
            status: f.status,
            sortBy: f.sortBy,
            sortOrder: f.sortOrder,
            page: f.page,
            limit: f.limit,
          })
        ),
        tap(() => (this.loading = false))
      )
      .subscribe({
        next: (res) => {
          const items = res.items;
          this.filteredPayments = items.data;
          this.totalItems = items.metadata.total;
          this.currentPage = items.metadata.page;
          this.totalPages = items.metadata.totalPage;
          this.calculateStats();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        },
      });

    this.sub.add(dataSub);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private updateFilters(patch: Partial<TransactionFilters>) {
    const next = { ...this.filters$.value, ...patch };
    this.filters$.next(next);
  }

  calculateStats() {
    this.totalAmount = this.filteredPayments
      .filter((p) => p.status === PaymentStatus.SUCCEEDED)
      .reduce((sum, p) => sum + p.amount, 0);

    this.successfulCount = this.filteredPayments.filter(
      (p) => p.status === PaymentStatus.SUCCEEDED
    ).length;

    this.pendingCount = this.filteredPayments.filter(
      (p) => p.status === PaymentStatus.PENDING
    ).length;

    this.failedCount = this.filteredPayments.filter(
      (p) => p.status === PaymentStatus.FAILED
    ).length;
  }

  onStatusChange(value: string) {
    this.selectedStatus = value;
    this.updateFilters({ status: value, page: 1 });
  }

  toggleSort(field: SortBy) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.updateFilters({
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      page: 1,
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateFilters({ page });
    }
  }

  get paginatedPayments(): any[] {
    return this.filteredPayments;
  }

  viewDetails(payment: Payment) {
    this.selectedPayment = payment;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedPayment = null;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      SUCCEEDED: 'status-succeeded',
      PENDING: 'status-pending',
      FAILED: 'status-failed',
      REFUNDED: 'status-refunded',
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      SUCCEEDED: 'Réussi',
      PENDING: 'En attente',
      FAILED: 'Échoué',
      REFUNDED: 'Remboursé',
    };
    return labels[status] || status;
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      SUCCEEDED: 'fa-circle-check',
      PENDING: 'fa-clock',
      FAILED: 'fa-circle-xmark',
      REFUNDED: 'fa-rotate-left',
    };
    return icons[status] || 'fa-circle';
  }

  goBack() {
    this.router.navigate(['/users/dashboard']);
  }
}
