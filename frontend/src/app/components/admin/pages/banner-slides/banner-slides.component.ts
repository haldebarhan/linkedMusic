import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AdminApi } from '../../data/admin-api.service';
import { SweetAlert } from '../../../../helpers/sweet-alert';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface BannerSlide {
  id: number;
  title?: string;
  description?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  link?: string;
  order: number;
  isActive: boolean;
  createdAt?: Date;
}

const MEDIA_REQUIREMENTS = {
  image: {
    minWidth: 1920,
    minHeight: 500,
    maxWidth: 3840,
    maxHeight: 2160,
    recommendedRatio: '16:9',
  },
  video: {
    minWidth: 1280,
    minHeight: 720,
    maxWidth: 1920,
    maxHeight: 1080,
    maxDuration: 31, // secondes
    recommendedRatio: '16:9',
  },
};

@Component({
  selector: 'app-banner-slides',
  imports: [CommonModule, FormsModule],
  templateUrl: './banner-slides.component.html',
  styleUrl: './banner-slides.component.css',
})
export class BannerSlidesComponent implements OnInit, OnDestroy {
  allSlides: BannerSlide[] = [];
  activeSlides: BannerSlide[] = [];

  filePreviewUrl: string | null = null;
  fileDimensions: string | null = null;

  page = 1;
  limit = 10;
  total = 0;
  totalPage = 1;
  pages: number[] = [];

  showUploadModal = false;
  showPreviewModal = false;
  previewSlide: BannerSlide | null = null;

  selectedFile: File | null = null;
  uploadProgress = 0;
  isUploading = false;

  formData = {
    title: '',
    description: '',
    mediaType: 'image' as 'image' | 'video',
    link: '',
  };

  constructor(private api: AdminApi, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.loadSlides(this.page);
  }

  ngOnDestroy(): void {
    if (this.filePreviewUrl) {
      URL.revokeObjectURL(this.filePreviewUrl);
    }
  }

  loadSlides(page: number, limit = 10) {
    this.api.listData({ endpoint: 'banner-slides', page, limit }).subscribe({
      next: (res) => {
        const slides: BannerSlide[] = res.items.data;
        this.allSlides = slides.sort(
          (a: BannerSlide, b: BannerSlide) => a.order - b.order
        );

        this.activeSlides = this.allSlides.filter((s) => s.isActive);

        const meta = res.items.metadata ?? {
          total: 0,
          page: 1,
          totalPage: 1,
        };
        this.total = meta.total;
        this.totalPage = meta.totalPage;
        this.page = meta.page;
        this.pages = this.buildPages(this.page, this.totalPage);
      },
      error: (err) => {
        console.error('Erreur lors du chargement:', err);
        this.removeFocusFromModal();

        SweetAlert.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les bannières',
        });
      },
    });
  }

  openUploadModal(): void {
    this.resetForm();
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.resetForm();
  }

  resetForm(): void {
    if (this.filePreviewUrl) {
      URL.revokeObjectURL(this.filePreviewUrl);
      this.filePreviewUrl = null;
    }
    this.formData = {
      title: '',
      description: '',
      mediaType: 'image',
      link: '',
    };
    this.selectedFile = null;
    this.fileDimensions = null;
    this.uploadProgress = 0;
  }

  openPreview(slide: BannerSlide): void {
    this.previewSlide = slide;
    this.showPreviewModal = true;
  }

  closePreview(): void {
    this.showPreviewModal = false;
    this.previewSlide = null;
  }

  async onfileChange(event: any) {
    if (this.filePreviewUrl) {
      URL.revokeObjectURL(this.filePreviewUrl);
      this.filePreviewUrl = null;
      this.fileDimensions = null;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      return;
    }

    // Validation du type de fichier
    const validImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];

    if (validImageTypes.includes(file.type)) {
      this.formData.mediaType = 'image';
      this.selectedFile = file;
      this.filePreviewUrl = URL.createObjectURL(file);
      this.cdr.detectChanges();

      // Valider les dimensions de l'image
      const isValid = await this.validateImageDimensions(file);
      if (!isValid) {
        return;
      }
    } else if (validVideoTypes.includes(file.type)) {
      this.formData.mediaType = 'video';
      this.selectedFile = file;
      this.filePreviewUrl = URL.createObjectURL(file);
      this.cdr.detectChanges();

      // ✅ FIX: Appeler la validation des dimensions vidéo !
      const isValid = await this.validateVideoDimensions(file);
      if (!isValid) {
        return;
      }
    } else {
      this.removeFocusFromModal();

      SweetAlert.fire({
        icon: 'error',
        title: 'Format non supporté',
        text: 'Formats acceptés: JPEG, PNG, GIF, WEBP, MP4, WEBM',
      });
    }
  }

  async uploadSlide() {
    if (!this.selectedFile) {
      this.removeFocusFromModal();

      SweetAlert.fire({
        icon: 'warning',
        title: 'Aucun fichier',
        text: 'Veuillez sélectionner un fichier',
      });
      return;
    }
    this.isUploading = true;
    const uploadData = new FormData();
    uploadData.append('file', this.selectedFile);

    this.api.postData('banner-slides', uploadData).subscribe({
      next: (res) => {
        this.removeFocusFromModal();

        SweetAlert.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Bannière ajoutée avec succès',
          timer: 2000,
        });

        this.closeUploadModal();
        this.loadSlides(this.page);
      },
      error: (err) => {
        this.isUploading = false;
      },
      complete: () => {
        this.isUploading = false;
      },
    });
  }

  buildPages(current: number, last: number) {
    const max = 5;
    let start = Math.max(1, current - Math.floor(max / 2));
    let end = Math.min(last, start + max - 1);
    start = Math.max(1, end - max + 1);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  get start() {
    return this.total ? (this.page - 1) * this.limit + 1 : 0;
  }
  get end() {
    return (this.page - 1) * this.limit + this.allSlides.length;
  }

  go(p: number) {
    if (p < 1 || p > this.totalPage || p === this.page) return;
    this.page = p;
    this.loadSlides(p);
  }

  toggleActive(slide: BannerSlide) {
    const newStatus = !slide.isActive;
    const action = newStatus ? 'activer' : 'désactiver';

    this.removeFocusFromModal();

    SweetAlert.fire({
      title: 'Confirmation',
      text: `Voulez-vous ${action} cette bannière ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.api
          .updateData('banner-slides/status', slide.id, { isActive: newStatus })
          .subscribe({
            next: () => {
              this.removeFocusFromModal();

              SweetAlert.fire({
                icon: 'success',
                title: 'Modifié',
                text: `Bannière ${action}ée avec succès`,
                timer: 2000,
                showConfirmButton: false,
              });
              this.loadSlides(this.page);
            },
            error: (err) => {
              console.error(err);
              this.removeFocusFromModal();

              SweetAlert.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de modifier le statut',
              });
            },
          });
      }
    });
  }

  deleteSlide(slide: BannerSlide): void {
    this.removeFocusFromModal();
    SweetAlert.fire({
      title: 'Êtes-vous sûr ?',
      text: `Supprimer la bannière "${slide.title || 'Sans titre'}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.removeData('banner-slides', slide.id).subscribe({
          next: () => {
            SweetAlert.fire({
              icon: 'success',
              title: 'Supprimé',
              text: 'Bannière supprimée avec succès',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadSlides(this.page);
          },
          error: (err) => {
            console.error(err);
            SweetAlert.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Impossible de supprimer la bannière',
            });
          },
        });
      }
    });
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  private async validateImageDimensions(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const requirements = MEDIA_REQUIREMENTS.image;

        // Afficher les dimensions détectées
        this.fileDimensions = `${width} x ${height}px`;

        // Vérifier les dimensions minimales
        if (width < requirements.minWidth || height < requirements.minHeight) {
          this.removeFocusFromModal();
          SweetAlert.fire({
            icon: 'warning',
            title: 'Image de faible qualité',
            html: `
              <p><strong>Dimensions détectées:</strong> ${width} x ${height}px</p>
              <p><strong>Dimensions minimales requises:</strong> ${requirements.minWidth} x ${requirements.minHeight}px</p>
              <p class="text-muted small">Pour une bannière de qualité, utilisez une image d'au moins ${requirements.minWidth}px de large.</p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Continuer quand même',
            cancelButtonText: 'Choisir une autre image',
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6c757d',
          }).then((result) => {
            if (result.isConfirmed) {
              resolve(true);
            } else {
              this.selectedFile = null;
              this.filePreviewUrl = null;
              this.fileDimensions = null;
              this.cdr.detectChanges();
              resolve(false);
            }
          });
        }
        // Vérifier les dimensions maximales
        else if (
          width > requirements.maxWidth ||
          height > requirements.maxHeight
        ) {
          this.removeFocusFromModal();
          SweetAlert.fire({
            icon: 'info',
            title: 'Image de très haute résolution',
            html: `
              <p><strong>Dimensions détectées:</strong> ${width} x ${height}px</p>
              <p><strong>Dimensions maximales recommandées:</strong> ${requirements.maxWidth} x ${requirements.maxHeight}px</p>
              <p class="text-muted small">L'image sera acceptée mais pourrait être lourde à charger.</p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Continuer',
            cancelButtonText: 'Choisir une autre image',
            confirmButtonColor: '#3085d6',
          }).then((result) => {
            if (result.isConfirmed) {
              resolve(true);
            } else {
              this.selectedFile = null;
              this.filePreviewUrl = null;
              this.fileDimensions = null;
              this.cdr.detectChanges();
              resolve(false);
            }
          });
        } else {
          // ✅ Dimensions parfaites
          resolve(true);
        }

        // Nettoyer
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        this.removeFocusFromModal();
        SweetAlert.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Impossible de lire les dimensions de l'image",
        });
        resolve(false);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private async validateVideoDimensions(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const duration = video.duration;
        const requirements = MEDIA_REQUIREMENTS.video;

        // Afficher les dimensions détectées
        this.fileDimensions = `${width} x ${height}px (${duration.toFixed(
          1
        )}s)`;

        // Vérifier la durée
        if (duration > requirements.maxDuration) {
          SweetAlert.fire({
            icon: 'warning',
            title: 'Vidéo trop longue',
            html: `
              <p><strong>Durée détectée:</strong> ${duration.toFixed(
                1
              )} secondes</p>
              <p><strong>Durée maximale:</strong> ${
                requirements.maxDuration
              } secondes</p>
              <p class="text-muted small">Les vidéos longues peuvent ralentir le chargement de la page.</p>
            `,
          });
          this.selectedFile = null;
          this.filePreviewUrl = null;
          this.fileDimensions = null;
          this.cdr.detectChanges();
          URL.revokeObjectURL(video.src);
          resolve(false);
          return;
        }

        // Vérifier les dimensions minimales
        if (width < requirements.minWidth || height < requirements.minHeight) {
          SweetAlert.fire({
            icon: 'warning',
            title: 'Vidéo de faible qualité',
            html: `
              <p><strong>Dimensions détectées:</strong> ${width} x ${height}px</p>
              <p><strong>Dimensions minimales requises:</strong> ${requirements.minWidth} x ${requirements.minHeight}px (HD 720p)</p>
              <p class="text-muted small">Pour une bannière de qualité, utilisez une vidéo HD minimum.</p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Continuer quand même',
            cancelButtonText: 'Choisir une autre vidéo',
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6c757d',
          }).then((result) => {
            if (result.isConfirmed) {
              URL.revokeObjectURL(video.src);
              resolve(true);
            } else {
              this.selectedFile = null;
              this.filePreviewUrl = null;
              this.fileDimensions = null;
              this.cdr.detectChanges();
              URL.revokeObjectURL(video.src);
              resolve(false);
            }
          });
        }
        // Vérifier les dimensions maximales
        else if (
          width > requirements.maxWidth ||
          height > requirements.maxHeight
        ) {
          SweetAlert.fire({
            icon: 'info',
            title: 'Vidéo de très haute résolution',
            html: `
              <p><strong>Dimensions détectées:</strong> ${width} x ${height}px</p>
              <p><strong>Dimensions maximales recommandées:</strong> ${requirements.maxWidth} x ${requirements.maxHeight}px (Full HD)</p>
              <p class="text-muted small">La vidéo sera acceptée mais pourrait être lourde à charger.</p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Continuer',
            cancelButtonText: 'Choisir une autre vidéo',
            confirmButtonColor: '#3085d6',
          }).then((result) => {
            if (result.isConfirmed) {
              URL.revokeObjectURL(video.src);
              resolve(true);
            } else {
              this.selectedFile = null;
              this.filePreviewUrl = null;
              this.fileDimensions = null;
              this.cdr.detectChanges();
              URL.revokeObjectURL(video.src);
              resolve(false);
            }
          });
        } else {
          // ✅ Dimensions parfaites
          URL.revokeObjectURL(video.src);
          resolve(true);
        }
      };

      video.onerror = () => {
        this.removeFocusFromModal();
        SweetAlert.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de lire les informations de la vidéo',
        });
        URL.revokeObjectURL(video.src);
        resolve(false);
      };

      video.src = URL.createObjectURL(file);
    });
  }

  private removeFocusFromModal(): void {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}
