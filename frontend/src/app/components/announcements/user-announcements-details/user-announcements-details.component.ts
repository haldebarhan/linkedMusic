import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MediaGalleryComponent } from '../../../shared/components/media-gallery/media-gallery.component';
import { SweetAlert } from '../../../helpers/sweet-alert';

@Component({
  selector: 'app-user-announcements-details',
  imports: [CommonModule, MediaGalleryComponent],
  templateUrl: './user-announcements-details.component.html',
  styleUrl: './user-announcements-details.component.css',
})
export class UserAnnouncementsDetailsComponent implements OnInit {
  announcement: any;
  user: any;
  constructor(
    private readonly api: ApiService<any>,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((pm) => {
      const idParam = pm.get('id');
      const id = idParam !== null ? +idParam : null;
      if (id) {
        this.api.getOne('users/announcements', id).subscribe({
          next: (res) => {
            this.announcement = res.data;
            this.user = res.data.user;
          },
          error: (err) => console.error(err),
        });
      }
    });
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
