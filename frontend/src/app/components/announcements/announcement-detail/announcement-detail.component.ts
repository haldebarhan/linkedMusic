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

@Component({
  selector: 'app-announcement-detail',
  imports: [CommonModule, ReactiveFormsModule, MediaGalleryComponent],
  templateUrl: './announcement-detail.component.html',
  styleUrl: './announcement-detail.component.css',
})
export class AnnouncementDetailComponent implements OnInit {
  user$: Observable<AuthUser | null>;
  isLoggedIn$: Observable<boolean>;
  advertiser: any;

  announcementId: number | null = null;
  loading: boolean = false;
  error: string | null = null;

  announcement: any;
  eligibility: Eligibility | null = null;

  showContactForm: boolean = false;
  form: FormGroup;
  sending: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private api: ApiService<any>,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(10)]],
    });
    this.user$ = this.auth.user$;
    this.isLoggedIn$ = this.auth.isLoggedIn$;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.announcementId = idParam !== null ? +idParam : null;

    if (this.announcementId) {
      const announcement$ = this.api.getOne(
        'announcements/details',
        this.announcementId
      );

      forkJoin({
        announcement: announcement$,
        isLoggedIn: this.auth.isLoggedIn$.pipe(take(1)),
      })
        .pipe(
          switchMap(({ announcement, isLoggedIn }) => {
            const eligibility$ = isLoggedIn
              ? this.api.getEligibility(this.announcementId!)
              : of(null);

            return forkJoin({
              announcement: of(announcement),
              eligibility: eligibility$,
            });
          }),
          finalize(() => (this.loading = false))
        )
        .subscribe({
          next: ({ announcement: annRes, eligibility: elRes }) => {
            this.announcement = annRes.data;
            this.advertiser = this.announcement.user;
            this.eligibility = elRes?.data || null;
          },
          error: (err) => {
            this.error = 'Impossible de charger cette annonce';
            console.error(err);
          },
        });
    }
  }

  // règles d'UI
  isLocked(): boolean {
    if (!this.eligibility) return false;
    const e = this.eligibility;
    return e.paidMatching && !e.hasActivePass && !e.alreadyPaid && !e.isOwner;
  }
  canContact(): boolean {
    if (!this.eligibility) return false;
    const e = this.eligibility;
    return !e.isOwner && (!e.paidMatching || e.hasActivePass || e.alreadyPaid);
  }

  onClickReply(): void {
    if (this.isLocked()) {
      this.router.navigate(['/pack/pricing-plan']);
    }
    if (this.canContact()) {
      this.showContactForm = true;
    }
  }

  goToLogin() {}

  submitMessage(): void {
    if (this.form.invalid || this.sending) return;
    this.sending = true;
    const content = this.form.value.content;
    this.api
      .sendMessage({ announcementId: this.announcementId, content })
      .subscribe({
        next: () => {
          this.sending = false;
          this.showContactForm = false;
          this.form.reset({ content: '' });
          Toast.fire({
            title: 'Message envoyé',
          });
        },
        error: (err) => {
          this.sending = false;
          alert(err?.error?.message || 'Échec de l’envoi');
          console.error(err);
        },
      });
  }
}
