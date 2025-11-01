import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../../shared/services/api.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
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
  advertiser: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService<any>
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.announcementId = idParam !== null ? +idParam : null;
    if (this.announcementId) {
      this.loading = true;
      const announcement$ = this.api.getOne(
        'announcements/details',
        this.announcementId
      );

      forkJoin({ announcement: announcement$ })
        .pipe(
          map(({ announcement }) => {
            this.announcement = announcement;
            return announcement;
          })
        )
        .subscribe(({ data }) => {
          this.announcement = data;
          this.advertiser = this.announcement.user;
          this.loading = false;
        });
    }
  }

  approuve(id: number) {
    Swal.fire({
      title: 'Approuver ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui!, approuver',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.update('admin/announcements/approuve', id, {}).subscribe({
          next: () => {
            Toast.fire({
              icon: 'success',
              title: 'Fait',
              didClose: () => {
                this.router.navigate(['/admin/publications']);
              },
            });
          },
          error: (err) => console.error(err),
        });
      }
    });
  }
  reject(id: number) {
    Swal.fire({
      title: 'Rejeter ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui!, rejeter',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.update('admin/announcements/reject', id, {}).subscribe({
          next: () => {
            Toast.fire({
              icon: 'success',
              title: 'Fait',
              didClose: () => {
                this.router.navigate(['/admin/publications']);
              },
            });
          },
          error: (err) => console.error(err),
        });
      }
    });
  }
}
