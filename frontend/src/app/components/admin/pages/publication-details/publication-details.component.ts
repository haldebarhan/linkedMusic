import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../../shared/services/api.service';
import { forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MediaGalleryComponent } from '../../../../shared/components/media-gallery/media-gallery.component';
import Swal from 'sweetalert2';
import { Toast } from '../../../../helpers/sweet-alert';

@Component({
  selector: 'app-publication-details',
  imports: [CommonModule, MediaGalleryComponent],
  templateUrl: './publication-details.component.html',
  styleUrl: './publication-details.component.css',
})
export class PublicationDetailsComponent implements OnInit {
  announcementId: number | null = null;
  announcement: any;
  loading: boolean = false;
  processing: boolean = false;
  advertiser: any;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService<any>
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.announcementId = idParam !== null ? +idParam : null;

    if (this.announcementId) {
      this.loadAnnouncementData();
    }
  }

  loadAnnouncementData(): void {
    this.loading = true;
    const announcement$ = this.api.getOne(
      'announcements/details',
      this.announcementId!
    );

    forkJoin({ announcement: announcement$ })
      .pipe(
        map(({ announcement }) => announcement),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: ({ data }) => {
          this.announcement = data;
          this.advertiser = this.announcement.owner || this.announcement.user;
        },
        error: (err) => {
          this.error = 'Impossible de charger cette annonce';
          console.error(err);
        },
      });
  }

  approuve(id: number): void {
    Swal.fire({
      title: 'Approuver cette annonce ?',
      text: "L'annonce sera publiée et visible par tous les utilisateurs",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#34a853',
      cancelButtonColor: '#5f6368',
      confirmButtonText: '<i class="fas fa-check"></i> Oui, approuver',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.processing = true;
        this.api
          .update('admin/announcements/approuve', id, {})
          .pipe(finalize(() => (this.processing = false)))
          .subscribe({
            next: () => {
              Toast.fire({
                icon: 'success',
                title: 'Annonce approuvée',
                text: "L'annonce est maintenant publiée",
                didClose: () => {
                  this.router.navigate(['/admin/publications']);
                },
              });
            },
            error: (err) => {
              Toast.fire({
                icon: 'error',
                title: 'Erreur',
                text: err?.error?.message || "Impossible d'approuver l'annonce",
              });
              console.error(err);
            },
          });
      }
    });
  }

  reject(id: number): void {
    Swal.fire({
      title: 'Rejeter cette annonce ?',
      text: "L'annonce ne sera pas publiée et l'auteur sera notifié",
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Raison du rejet (optionnel)',
      inputPlaceholder: 'Expliquez pourquoi cette annonce est rejetée...',
      showCancelButton: true,
      confirmButtonColor: '#ea4335',
      cancelButtonColor: '#5f6368',
      confirmButtonText: '<i class="fas fa-times"></i> Oui, rejeter',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
      inputValidator: (value) => {
        if (value && value.length > 500) {
          return 'Le message ne peut pas dépasser 500 caractères';
        }
        return null;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.processing = true;
        const payload = result.value ? { reason: result.value } : {};
        this.api
          .update('admin/announcements/reject', id, payload)
          .pipe(finalize(() => (this.processing = false)))
          .subscribe({
            next: () => {
              Toast.fire({
                icon: 'success',
                title: 'Annonce rejetée',
                text: "L'auteur sera notifié du rejet",
                didClose: () => {
                  this.router.navigate(['/admin/publications']);
                },
              });
            },
            error: (err) => {
              Toast.fire({
                icon: 'error',
                title: 'Erreur',
                text: err?.error?.message || "Impossible de rejeter l'annonce",
              });
              console.error(err);
            },
          });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/publications']);
  }

  getStatusBadgeClass(): string {
    const status = this.announcement?.status;
    switch (status) {
      case 'PENDING_APPROVAL':
        return 'badge-warning';
      case 'PUBLISHED':
        return 'badge-success';
      case 'REJECTED':
        return 'badge-danger';
      case 'DRAFT':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

  getStatusLabel(): string {
    const status = this.announcement?.status;
    switch (status) {
      case 'PENDING_APPROVAL':
        return 'En attente';
      case 'PUBLISHED':
        return 'Publiée';
      case 'REJECTED':
        return 'Rejetée';
      case 'DRAFT':
        return 'Brouillon';
      default:
        return status || 'Inconnu';
    }
  }
}
