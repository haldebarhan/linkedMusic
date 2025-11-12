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

  // UI States
  showContactRequestForm: boolean = false;
  contactRequestForm: FormGroup;
  sending: boolean = false;

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

          return forkJoin({
            announcement: of(announcement),
            eligibility: eligibility$,
            userRequest: userRequest$,
          });
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: ({ announcement: annRes, eligibility: elRes, userRequest }) => {
          this.announcement = annRes.data;
          this.advertiser = this.announcement.owner;
          this.eligibility = elRes?.data || null;
          this.currentUserRequest = userRequest?.data || null;
        },
        error: (err) => {
          this.error = 'Impossible de charger cette annonce';
          console.error(err);
        },
      });
  }

  // Règles d'UI
  isOwner(): boolean {
    return this.eligibility?.isOwner || false;
  }

  canRequestContact(): boolean {
    if (!this.eligibility) return false;
    // Peut demander un contact si : pas le propriétaire, pas de demande en cours
    return !this.isOwner() && !this.currentUserRequest;
  }

  hasRequestPending(): boolean {
    return this.currentUserRequest?.status === 'PENDING';
  }

  hasRequestAccepted(): boolean {
    return this.currentUserRequest?.status === 'ACCEPTED';
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
        next: () => {
          this.currentUserRequest = null;
          Toast.fire({
            icon: 'info',
            title: 'Demande annulée',
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
      this.router.navigate(['/messages']);
    }
  }
}
