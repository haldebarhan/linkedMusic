import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminApi } from '../../data/admin-api.service';
import { Badge } from '../../../../shared/enums/badge.enum';
import { SweetAlert, Toast } from '../../../../helpers/sweet-alert';

@Component({
  selector: 'app-users-details',
  imports: [CommonModule],
  templateUrl: './users-details.component.html',
  styleUrl: './users-details.component.css',
})
export class UsersDetailsComponent implements OnInit {
  user: any = null;
  loading = true;
  userId: number | null = null;
  Badge = Badge;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: AdminApi
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId = +params['id'];
      if (!this.userId) return;
      this.loadUserdetails(this.userId);
    });
  }

  loadUserdetails(userId: number) {
    this.loading = true;
    this.api.findData('users', userId).subscribe({
      next: (res) => (this.user = res.data),
      error: (err) => console.error(err),
      complete: () => (this.loading = false),
    });
  }

  getBadgeIcon(badge: Badge): string {
    const mapping: Record<Badge, string> = {
      [Badge.STANDARD]: '/assets/badges/badge_STANDARD.svg',
      [Badge.BRONZE]: '/assets/badges/badge_BRONZE.svg',
      [Badge.SILVER]: '/assets/badges/badge_ARGENT.svg',
      [Badge.GOLD]: '/assets/badges/badge_OR.svg',
      [Badge.VIP]: '/assets/badges/badge_VIP.svg',
      [Badge.VVIP]: '/assets/badges/badge_VVIP.svg',
    };
    return mapping[badge] || '';
  }

  getBadgeLabel(badge: Badge): string {
    const mapping: Record<Badge, string> = {
      [Badge.STANDARD]: 'Standard',
      [Badge.BRONZE]: 'Bronze',
      [Badge.SILVER]: 'Argent',
      [Badge.GOLD]: 'Or',
      [Badge.VIP]: 'VIP',
      [Badge.VVIP]: 'VVIP',
    };
    return mapping[badge] || badge;
  }

  getStatusLabel(status: string): string {
    const mapping: Record<string, string> = {
      ACTIVATED: 'Activé',
      DEACTIVATED: 'Désactivé',
      SUSPENDED: 'Suspendu',
      BANNED: 'Banni',
      CLOSED: 'Fermé',
    };
    return mapping[status] || status;
  }

  getStatusClass(status: string): string {
    const mapping: Record<string, string> = {
      ACTIVATED: 'badge-success',
      DEACTIVATED: 'badge-warning',
      SUSPENDED: 'badge-danger',
      CLOSED: 'badge-danger',
      BANNED: 'badge-dark',
    };
    return mapping[status] || 'badge-secondary';
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }

  activateUser(userId: number) {
    SweetAlert.fire({
      title: 'Êtes-vous sûr ?',
      text: `Voulez-vous activer cet utilisateur ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'rgba(23, 2, 209, 1)',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, je confirme',
      cancelButtonText: 'Annuler',
      reverseButtons: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.updateData('users/activate-account', userId, {}).subscribe({
          next: () => {
            Toast.fire({
              title: 'Effectué',
              icon: 'success',
              didClose: () => this.loadUserdetails(userId),
            });
          },
          error: () => {
            Toast.fire({
              title: 'Echec',
              icon: 'error',
            });
          },
        });
      }
    });
  }

  deleteUser(userId: number) {
    SweetAlert.fire({
      title: 'Êtes-vous sûr ?',
      text: `Voulez-vous supprimer cet utilisateur ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'rgba(23, 2, 209, 1)',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, je confirme',
      cancelButtonText: 'Annuler',
      reverseButtons: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.updateData('users/close-account', userId, {}).subscribe({
          next: () => {
            Toast.fire({
              title: 'Effectué',
              icon: 'success',
              didClose: () => this.loadUserdetails(userId),
            });
          },
          error: () => {
            Toast.fire({
              title: 'Echec',
              icon: 'error',
            });
          },
        });
      }
    });
  }

  changeBadge(userId: number, badge: Badge) {
    SweetAlert.fire({
      title: 'Êtes-vous sûr ?',
      text: `Voulez-vous attribuer le badge ${badge} à cet utilisateur ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'rgba(23, 2, 209, 1)',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, je confirme',
      cancelButtonText: 'Annuler',
      reverseButtons: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.postData('users/assign-badge', { userId, badge }).subscribe({
          next: () => {
            Toast.fire({
              title: 'Effectué',
              icon: 'success',
              didClose: () => this.loadUserdetails(userId),
            });
          },
          error: () => {
            Toast.fire({
              title: 'Echec',
              icon: 'error',
            });
          },
        });
      }
    });
  }
}
