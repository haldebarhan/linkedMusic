import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MediaGalleryComponent } from '../../../shared/components/media-gallery/media-gallery.component';
import { SweetAlert } from '../../../helpers/sweet-alert';
import { finalize, forkJoin, Observable, of, switchMap, take } from 'rxjs';
import { Eligibility } from '../../../shared/types/eligibility.type';
import { AuthUser } from '../../../shared/interfaces/auth';
import { AuthService } from '../../../auth/auth.service';

interface ContactRequest {
  id: number;
  requesterId: number;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';
  createdAt: string;
  requester: {
    id: number;
    displayName: string;
    profileImage: string;
    location?: string;
  };
}

@Component({
  selector: 'app-user-announcements-details',
  imports: [CommonModule, MediaGalleryComponent],
  templateUrl: './user-announcements-details.component.html',
  styleUrl: './user-announcements-details.component.css',
})
export class UserAnnouncementsDetailsComponent implements OnInit {
  // current user

  user$: Observable<AuthUser | null>;
  isLoggedIn$: Observable<boolean>;
  currentUser: AuthUser | null = null;

  announcement: any;
  user: any;

  // Demandes de mise en relation
  contactRequests: ContactRequest[] = [];
  hasActiveSubscription: boolean = false;
  loadingRequests: boolean = false;
  processingRequest: number | null = null;
  showRequestsList: boolean = false;
  eligibility: Eligibility | null = null;

  constructor(
    private readonly api: ApiService<any>,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private auth: AuthService
  ) {
    this.user$ = this.auth.user$;
    this.isLoggedIn$ = this.auth.isLoggedIn$;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((pm) => {
      const idParam = pm.get('id');
      const id = idParam !== null ? +idParam : null;
      if (id) {
        this.loadAnnouncementData(id);
      }
    });
  }

  loadAnnouncementData(id: number): void {
    this.loadingRequests = true;
    const announcement$ = this.api.getOne('users/announcements', id);
    forkJoin({
      announcement: announcement$,
      isLoggedIn: this.auth.isLoggedIn$.pipe(take(1)),
      user: this.auth.user$.pipe(take(1)),
    })
      .pipe(
        switchMap(({ announcement, isLoggedIn, user }) => {
          this.currentUser = user;

          const eligibility$ = isLoggedIn
            ? this.api.getEligibility(id)
            : of(null);

          const contactRequests$ = isLoggedIn
            ? this.api.getOne('users/contact-requests/announcement', id)
            : of(null);

          return forkJoin({
            announcement: of(announcement),
            eligibility: eligibility$,
            requests: contactRequests$,
          });
        }),
        finalize(() => (this.loadingRequests = false))
      )
      .subscribe({
        next: ({ announcement: annRes, eligibility: elRes, requests }) => {
          this.announcement = annRes.data;
          this.eligibility = elRes?.data || null;
          this.contactRequests = requests?.data || null;
        },
        error: (err) => {
          //   this.error = 'Impossible de charger cette annonce';
          console.error(err);
        },
      });
  }

  loadContactRequests(announcementId: number): void {
    this.loadingRequests = true;
    this.api
      .getOne('users/contact-requests/announcement', announcementId)
      .pipe(finalize(() => (this.loadingRequests = false)))
      .subscribe({
        next: (res) => {
          this.contactRequests = res.data || [];
        },
        error: (err) => {
          console.error('Erreur lors du chargement des demandes:', err);
        },
      });
  }

  get pendingRequestsCount(): number {
    return this.contactRequests.filter((r) => r.status === 'PENDING').length;
  }

  respondToRequest(requestId: number, action: 'accept' | 'reject'): void {
    if (this.processingRequest || !this.hasActiveSubscription) return;

    this.processingRequest = requestId;
    this.api
      .update(`users/contact-requests/${action}`, requestId, {})
      .pipe(finalize(() => (this.processingRequest = null)))
      .subscribe({
        next: (res) => {
          // Mettre à jour la liste
          const index = this.contactRequests.findIndex(
            (r) => r.id === requestId
          );
          if (index !== -1) {
            this.contactRequests[index] = res.data;
          }

          SweetAlert.fire({
            icon: 'success',
            title: action === 'accept' ? 'Demande acceptée' : 'Demande rejetée',
            text:
              action === 'accept'
                ? 'Vous pouvez maintenant échanger des messages'
                : 'La demande a été rejetée',
          });
        },
        error: (err) => {
          SweetAlert.fire({
            icon: 'error',
            title: 'Erreur',
            text: err?.error?.message || 'Impossible de traiter la demande',
          });
          console.error(err);
        },
      });
  }

  toggleRequestsList(): void {
    this.showRequestsList = !this.showRequestsList;
  }

  goToSubscription(): void {
    this.router.navigate(['/pack/pricing-plan']);
  }

  removeAnnouncement(annId: number) {
    SweetAlert.fire({
      title: 'Etes-vous sure ?',
      icon: 'warning',
      text: `Vous allez supprimer cette annonce`,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, je confirme',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.delete('users/announcements', annId).subscribe({
          next: () => {
            SweetAlert.fire({
              title: 'Supprimé!',
              text: `l'annonce a bien été supprimé`,
              icon: 'success',
              didClose: () => {
                this.goBack();
              },
            });
          },
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/profile/announcements']);
  }

  editAnnouncement(announcementid: number) {
    this.router.navigate(['/announcemnts/edit', announcementid]);
  }

  styles(): string[] {
    return (this.announcement.styles as string[]) || [];
  }

  tag() {
    return (this.announcement.tag as string) || '';
  }
}
