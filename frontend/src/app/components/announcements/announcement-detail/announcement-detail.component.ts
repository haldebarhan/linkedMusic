import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { Eligibility } from '../../../shared/types/eligibility.type';
import { finalize, forkJoin, Observable, of, switchMap, take } from 'rxjs';
import { AuthUser } from '../../../shared/interfaces/auth';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { MediaGalleryComponent } from '../../../shared/components/media-gallery/media-gallery.component';
import { Toast } from '../../../helpers/sweet-alert';
import { Badge } from '../../../shared/enums/badge.enum';

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
  selector: 'app-announcement-detail',
  imports: [CommonModule, ReactiveFormsModule, MediaGalleryComponent],
  templateUrl: './announcement-detail.component.html',
  styleUrl: './announcement-detail.component.css',
})
export class AnnouncementDetailComponent implements OnInit {
  user$: Observable<AuthUser | null>;
  isLoggedIn$: Observable<boolean>;
  currentUser: AuthUser | null = null;
  advertiser: any;

  announcementId: number | null = null;
  loading: boolean = false;
  error: string | null = null;

  announcement: any;
  eligibility: Eligibility | null = null;

  // Demande de l'utilisateur actuel
  currentUserRequest: ContactRequest | null = null;

  // Like system
  isLiked: boolean = false;
  likeCount: number = 0;
  likingInProgress: boolean = false;

  // UI States
  showContactRequestForm: boolean = false;
  contactRequestForm: FormGroup;
  sending: boolean = false;

  message = '';
  placeholder = 'Bonjour, je suis intéressé(e) par votre annonce car ';

  // Enum Badge accessible dans le template
  Badge = Badge;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private api: ApiService<any>,
    private auth: AuthService
  ) {
    this.contactRequestForm = this.fb.group({
      message: [
        '',
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(500),
        ],
      ],
    });
    this.user$ = this.auth.user$;
    this.isLoggedIn$ = this.auth.isLoggedIn$;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.announcementId = idParam !== null ? +idParam : null;

    if (this.announcementId) {
      this.loadAnnouncementData();
      this.trackView();
    }
  }

  onFocus() {
    if (this.message === '') {
      this.message = this.placeholder;
    }
  }

  loadAnnouncementData(): void {
    this.loading = true;
    const announcement$ = this.api.getOne(
      'announcements/details',
      this.announcementId!
    );

    forkJoin({
      announcement: announcement$,
      isLoggedIn: this.auth.isLoggedIn$.pipe(take(1)),
      user: this.auth.user$.pipe(take(1)),
    })
      .pipe(
        switchMap(({ announcement, isLoggedIn, user }) => {
          this.currentUser = user;

          const eligibility$ = isLoggedIn
            ? this.api.getEligibility(this.announcementId!)
            : of(null);

          const userRequest$ = isLoggedIn
            ? this.api.getOne(
                'users/contact-requests/my-request',
                this.announcementId!
              )
            : of(null);

          const likeStatus$ = isLoggedIn
            ? this.api.getOne(
                'users/announcements/like-status',
                this.announcementId!
              )
            : of(null);

          return forkJoin({
            announcement: of(announcement),
            eligibility: eligibility$,
            userRequest: userRequest$,
            likeStatus: likeStatus$,
          });
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: ({
          announcement: annRes,
          eligibility: elRes,
          userRequest,
          likeStatus,
        }) => {
          this.announcement = annRes.data;
          this.advertiser = this.announcement.owner;
          this.eligibility = elRes?.data || null;
          this.currentUserRequest = userRequest?.data || null;

          // Initialiser les données de like
          if (likeStatus?.data) {
            this.isLiked = likeStatus.data.isLiked;
            this.likeCount = likeStatus.data.likeCount;
          } else if (this.announcement.likesCount !== undefined) {
            this.likeCount = this.announcement.likesCount;
          }
        },
        error: (err) => {
          this.error = 'Impossible de charger cette annonce';
          console.error(err);
        },
      });
  }

  // Tracker la vue de l'annonce
  trackView(): void {
    this.auth.isLoggedIn$.pipe(take(1)).subscribe((isLoggedIn) => {
      if (this.announcementId && isLoggedIn) {
        this.api
          .create('users/announcements/track-view', {
            announcementId: this.announcementId,
          })
          .subscribe({
            next: () => {},
            error: (err) => {},
          });
      }
    });
  }

  // Système de likes
  toggleLike(): void {
    // Vérifier si l'utilisateur est connecté
    this.auth.isLoggedIn$.pipe(take(1)).subscribe((isLoggedIn) => {
      if (!isLoggedIn) {
        this.goToLogin();
        return;
      }

      // Vérifier si l'utilisateur est propriétaire
      if (this.isOwner()) {
        Toast.fire({
          icon: 'info',
          title: 'Action non autorisée',
          text: 'Vous ne pouvez pas liker votre propre annonce',
        });
        return;
      }

      // Toggle like
      if (this.likingInProgress) return;

      this.likingInProgress = true;
      const previousLiked = this.isLiked;
      const previousCount = this.likeCount;

      // Mise à jour optimiste de l'UI
      this.isLiked = !this.isLiked;
      this.likeCount = this.isLiked ? this.likeCount + 1 : this.likeCount - 1;

      const endpoint = previousLiked
        ? 'users/announcements/unlike'
        : 'users/announcements/like';

      this.api
        .create(endpoint, { announcementId: this.announcementId })
        .pipe(finalize(() => (this.likingInProgress = false)))
        .subscribe({
          next: (res) => {
            // Succès - l'UI est déjà à jour
            if (res?.data) {
              this.isLiked = res.data.isLiked;
              this.likeCount = res.data.likeCount;
            }
          },
          error: (err) => {
            // Rollback en cas d'erreur
            this.isLiked = previousLiked;
            this.likeCount = previousCount;

            Toast.fire({
              icon: 'error',
              title: 'Erreur',
              text:
                err?.error?.message || 'Impossible de mettre à jour le like',
            });
            console.error(err);
          },
        });
    });
  }

  // Règles d'UI
  isOwner(): boolean {
    return this.eligibility?.isOwner || false;
  }

  canRequestContact(): boolean {
    if (!this.eligibility) return false;
    if (this.isOwner()) return false;

    // Permettre une nouvelle demande si la précédente est CANCELED ou REJECTED
    if (!this.currentUserRequest) return true;

    const inactiveStatuses: ContactRequest['status'][] = [
      'CANCELED',
      'REJECTED',
    ];
    return inactiveStatuses.includes(this.currentUserRequest.status);
  }

  hasRequestPending(): boolean {
    return this.currentUserRequest?.status === 'PENDING';
  }

  hasRequestAccepted(): boolean {
    return this.currentUserRequest?.status === 'ACCEPTED';
  }

  hasRequestRejected(): boolean {
    return this.currentUserRequest?.status === 'REJECTED';
  }

  hasRequestCanceled(): boolean {
    return this.currentUserRequest?.status === 'CANCELED';
  }

  onClickContactRequest(): void {
    this.showContactRequestForm = true;
  }

  submitContactRequest(): void {
    if (this.contactRequestForm.invalid || this.sending) return;

    this.sending = true;
    const payload = {
      announcementId: this.announcementId,
      message: this.contactRequestForm.value.message,
    };

    this.api
      .create('users/contact-requests', payload)
      .pipe(finalize(() => (this.sending = false)))
      .subscribe({
        next: (res) => {
          this.currentUserRequest = res.data;
          this.showContactRequestForm = false;
          this.contactRequestForm.reset();
          Toast.fire({
            icon: 'success',
            title: 'Demande envoyée avec succès',
            text: "L'annonceur recevra une notification",
          });
        },
        error: (err) => {
          Toast.fire({
            icon: 'error',
            title: 'Erreur',
            text: err?.error?.message || "Impossible d'envoyer la demande",
          });
          console.error(err);
        },
      });
  }

  cancelContactRequest(): void {
    if (!this.currentUserRequest || this.sending) return;

    this.sending = true;
    this.api
      .update('users/contact-requests/cancel', this.currentUserRequest.id, {})
      .pipe(finalize(() => (this.sending = false)))
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.currentUserRequest = res.data;
          } else {
            this.currentUserRequest = {
              ...this.currentUserRequest!,
              status: 'CANCELED',
            };
          }

          Toast.fire({
            icon: 'info',
            title: 'Demande annulée',
            text: 'Vous pouvez faire une nouvelle demande',
          });
        },
        error: (err) => {
          Toast.fire({
            icon: 'error',
            title: 'Erreur',
            text: err?.error?.message || "Impossible d'annuler la demande",
          });
          console.error(err);
        },
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  goToMessages(): void {
    if (this.currentUserRequest?.status === 'ACCEPTED') {
      this.router.navigate(['/profile/messages']);
    }
  }

  /**
   * Retourne le chemin vers l'icône du badge
   */
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

  /**
   * Retourne le label du badge
   */
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
}
