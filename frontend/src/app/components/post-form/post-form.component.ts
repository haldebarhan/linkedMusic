import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Category,
  CategoryField,
  CategorySchema,
  Field,
  FieldInputType,
  FieldValueDto,
} from '../../shared/types/field-input-type';
import { formatLabel } from '../../helpers/input-label';
import { SweetAlert, Toast } from '../../helpers/sweet-alert';
import { MediaGalleryComponent } from '../../shared/components/media-gallery/media-gallery.component';
import {
  baseName,
  guessKind,
  guessMime,
  kindFromMimeOrName,
  stableIdFromUrl,
} from '../../helpers/path-part';
import { country_list } from '../../helpers/countries';
import { VideoTrimmerComponent } from '../../shared/components/video-trimmer/video-trimmer.component';

type PreviewItem = {
  url: string;
  id: string;
  name?: string;
  mime?: string;
  kind?: 'image' | 'audio' | 'video';
  /** révoquer l’objectURL quand on nettoie */
  __revoke__?: () => void;
};

@Component({
  selector: 'app-post-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MediaGalleryComponent,
    VideoTrimmerComponent,
  ],
  templateUrl: './post-form.component.html',
  styleUrl: './post-form.component.css',
})
export class PostFormComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Fichiers
  existingFiles: PreviewItem[] = [];
  previewFiles: PreviewItem[] = [];
  files: File[] = [];
  private fileUrls: PreviewItem[] = [];
  private removedExisting = new Set<string>();
  private objectUrlToFile = new Map<string, File>();

  readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB en bytes
  readonly MAX_INDIVIDUAL_FILE_SIZE = 20 * 1024 * 1024; // 20MB par fichier
  readonly MAX_VIDEO_DURATION = 60; // 60 secondes

  showVideoTrimmer = false;
  currentVideoToTrim: { file: File; url: string; index: number } | null = null;
  videosToTrim: Array<{ file: File; url: string; needsTrim: boolean }> = [];

  fileSizeError: string | null = null;

  // Catégorie et données
  slug: string | null = null;
  categorySlug: string | null = null;
  categoryName: string = '';
  categoryId: number | null = null;
  label: string = '';

  // Annonce (mode édition)
  announcement: any = null;
  announcementId: number | null = null;

  // Champs dynamiques - Structure adaptée à l'API
  categorySchema: CategorySchema | null = null;
  visibleFields: CategoryField[] = [];

  // Formulaire
  form!: FormGroup;
  submitting = false;
  loadingSchema = false;

  services: any[] = [];
  dynFields: any[] = [];
  commonFields: Field[] = [];

  // Pays
  countries: Array<{ name: string; code: string }> = [];

  constructor(
    private readonly apiService: ApiService<any>,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder
  ) {}
  ngOnInit(): void {
    this.countries = country_list;

    const idParam = this.route.snapshot.paramMap.get('id');
    this.announcementId = idParam !== null ? +idParam : null;
    this.slug = this.route.snapshot.paramMap.get('category');

    // Validation du routing
    if (!this.slug && !this.announcementId) {
      this.router.navigate(['/annonces/publier']);
      return;
    }

    // Chargement
    if (this.announcementId) {
      this.loadAnnouncement(this.announcementId);
    } else if (this.slug) {
      this.categorySlug = this.slug;
      this.label = formatLabel(this.slug);
      this.loadSchema(this.slug);
    }
  }

  ngOnDestroy(): void {
    this.clearNewFileUrls();
  }

  /**
   * Charge une annonce existante pour l'édition
   */
  loadAnnouncement(id: number): void {
    this.apiService.getOne('users/announcements', id).subscribe({
      next: (res) => {
        this.announcement = res.data;
        const slug = this.announcement.category.slug;

        this.categorySlug = slug;
        this.label = formatLabel(slug);
        this.loadSchema(slug);
      },
      error: (err) => {
        console.error('Erreur chargement annonce:', err);
        Toast.fire({
          icon: 'error',
          text: "Impossible de charger l'annonce",
        });
      },
    });
  }

  /**
   * Charge le schéma de la catégorie
   */
  loadSchema(slug: string): void {
    this.loadingSchema = true;

    this.apiService
      .getAll({
        endpoint: `categories/${slug}`,
      })
      .subscribe({
        next: (res: any) => {
          this.categorySchema = res.data;
          this.categoryId = this.categorySchema!.id;
          this.categoryName = this.categorySchema!.name;

          // Filtrer les champs visibles dans le formulaire
          this.visibleFields = this.categorySchema!.categoryFields.filter(
            (cf) => cf.visibleInForm
          ).sort((a, b) => a.order - b.order);

          // Construire le formulaire
          this.buildForm();

          // Si mode édition, patcher les valeurs
          if (this.announcement) {
            this.patchForm();
          }
        },
        error: (err) => {
          console.error('Erreur chargement schéma:', err);
          Toast.fire({
            icon: 'error',
            text: 'Impossible de charger le formulaire',
          });
        },
        complete: () => {
          this.loadingSchema = false;
        },
      });
  }

  /**
   * Construit le formulaire avec les champs de base + champs dynamiques
   */
  private buildForm(): void {
    const group: any = {
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      country: ['Côte d’Ivoire'],
      city: [''],
      price: [''],
    };

    // Ajouter tous les champs dynamiques
    this.visibleFields.forEach((categoryField) => {
      this.addControlForField(group, categoryField);
    });

    this.form = this.fb.group(group);
  }

  /**
   * Ajoute un contrôle de formulaire pour un champ donné
   */
  private addControlForField(group: any, categoryField: CategoryField): void {
    const field = categoryField.field;
    const validators = categoryField.required ? [Validators.required] : [];

    // Ajouter des validateurs supplémentaires selon le type
    if (field.minLength) validators.push(Validators.minLength(field.minLength));
    if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));
    if (typeof field.minValue === 'number')
      validators.push(Validators.min(field.minValue));
    if (typeof field.maxValue === 'number')
      validators.push(Validators.max(field.maxValue));
    if (field.pattern) validators.push(Validators.pattern(field.pattern));

    switch (field.inputType) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'SELECT':
      case 'RADIO':
        group[field.key] = new FormControl(
          categoryField.defaultValue || '',
          validators
        );
        break;

      case 'NUMBER':
        group[field.key] = new FormControl(
          categoryField.defaultValue || '',
          validators
        );
        break;

      case 'RANGE':
        group[`${field.key}_min`] = new FormControl('');
        group[`${field.key}_max`] = new FormControl('');
        break;

      case 'CHECKBOX':
      case 'MULTISELECT':
        group[field.key] = new FormControl(categoryField.defaultValue || []);
        break;

      case 'TOGGLE':
        group[field.key] = new FormControl(
          categoryField.defaultValue !== null
            ? categoryField.defaultValue
            : false
        );
        break;

      default:
        // Type non reconnu, ajouter un contrôle par défaut
        group[field.key] = new FormControl(
          categoryField.defaultValue || '',
          validators
        );
    }
  }

  /**
   * Remplit le formulaire avec les données d'une annonce existante
   */
  private patchForm(): void {
    if (!this.announcement) return;

    const ann = this.announcement;

    // Fichiers existants
    this.hydrateExistingFiles(ann.fichiers || ann.images || []);

    // Valeurs de base
    this.form.patchValue({
      title: ann.title,
      description: ann.description,
      city: ann.city,
      country: ann.country,
      price: ann.price,
    });

    // Valeurs dynamiques depuis fieldValues
    if (ann.fieldValues && Array.isArray(ann.fieldValues)) {
      ann.fieldValues.forEach((fv: any) => {
        const fieldKey = fv.field?.key;
        if (!fieldKey || !this.form.contains(fieldKey)) return;

        // Déterminer la valeur selon le type
        let value: any;

        if (fv.valueBoolean !== undefined && fv.valueBoolean !== null) {
          value = fv.valueBoolean;
        } else if (fv.valueNumber !== undefined && fv.valueNumber !== null) {
          value = fv.valueNumber;
        } else if (fv.valueText !== undefined && fv.valueText !== null) {
          value = fv.valueText;
        } else if (fv.options && Array.isArray(fv.options)) {
          // Pour les multiselect/checkbox
          value = fv.options.map((opt: any) => opt.value);
        } else if (fv.valueJson) {
          value = fv.valueJson;
        }

        if (value !== undefined) {
          this.form.get(fieldKey)?.setValue(value);
        }
      });
    }
  }

  /**
   * Soumet le formulaire
   */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Toast.fire({
        icon: 'warning',
        text: 'Veuillez remplir tous les champs obligatoires',
      });
      return;
    }

    this.submitting = true;
    const payload = this.buildPayload();
    const formData = this.announcementId
      ? this.buildUpdateFormData(payload)
      : this.buildCreateFormData(payload);

    const endpoint = 'users/announcements';
    const obs = this.announcementId
      ? this.apiService.update(endpoint, this.announcementId, formData)
      : this.apiService.create(endpoint, formData);

    obs.subscribe({
      next: () => {
        this.resetForm();
        Toast.fire({
          icon: 'success',
          title: this.announcementId ? 'Annonce mise à jour' : 'Annonce créée',
          text: 'En cours de validation',
          didClose: () => this.router.navigate(['/profile/announcements']),
        });
      },
      error: (err) => {
        console.error('Erreur soumission:', err);
        Toast.fire({
          icon: 'error',
          text: err.error?.message || 'Une erreur est survenue',
        });
      },
      complete: () => {
        this.submitting = false;
      },
    });
  }

  /**
   * Construit le payload JSON pour l'API selon le DTO
   */
  private buildPayload(): any {
    const formValues = this.form.value;
    const fieldValues: FieldValueDto[] = [];

    // Transformer chaque champ en FieldValueDto
    this.visibleFields.forEach((categoryField) => {
      const field = categoryField.field;
      const key = field.key;
      const fieldValue: FieldValueDto = {
        fieldId: field.id,
      };

      if (field.inputType === 'RANGE') {
        // Pour les champs RANGE, stocker comme JSON
        const minValue = formValues[`${key}_min`];
        const maxValue = formValues[`${key}_max`];

        if (
          minValue !== '' &&
          minValue !== null &&
          maxValue !== '' &&
          maxValue !== null
        ) {
          fieldValue.valueJson = { min: minValue, max: maxValue };
          fieldValues.push(fieldValue);
        }
      } else {
        const value = formValues[key];

        // Ignorer les valeurs vides
        if (value === undefined || value === null || value === '') {
          return;
        }

        // Mapper selon le type de champ
        switch (field.inputType) {
          case 'TEXT':
          case 'TEXTAREA':
            fieldValue.valueText = String(value);
            fieldValues.push(fieldValue);
            break;

          case 'NUMBER':
            fieldValue.valueNumber = Number(value);
            fieldValues.push(fieldValue);
            break;

          case 'TOGGLE':
            fieldValue.valueBoolean = Boolean(value);
            fieldValues.push(fieldValue);
            break;

          case 'SELECT':
          case 'RADIO':
            // Trouver l'ID de l'option correspondante
            const option = field.options.find((opt) => opt.value === value);
            if (option) {
              fieldValue.optionIds = [option.id];
              fieldValues.push(fieldValue);
            }
            break;

          case 'CHECKBOX':
          case 'MULTISELECT':
            // Trouver les IDs des options correspondantes
            if (Array.isArray(value) && value.length > 0) {
              const optionIds = value
                .map((v) => field.options.find((opt) => opt.value === v)?.id)
                .filter((id): id is number => id !== undefined);

              if (optionIds.length > 0) {
                fieldValue.optionIds = optionIds;
                fieldValues.push(fieldValue);
              }
            }
            break;

          default:
            // Type non géré, stocker comme texte
            fieldValue.valueText = String(value);
            fieldValues.push(fieldValue);
        }
      }
    });

    return {
      title: formValues.title,
      categoryId: this.categoryId,
      description: formValues.description,
      price: formValues.price ? Number(formValues.price) : undefined,
      location: `${formValues.city || ''} ${formValues.country || ''}`.trim(),
      country: formValues.country || undefined,
      city: formValues.city || undefined,
      fieldValues: fieldValues,
    };
  }

  /**
   * Construit le FormData pour la création
   */
  private buildCreateFormData(payload: any): FormData {
    const fd = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      fd.append(
        key,
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      );
    });

    this.files.forEach((file) => {
      fd.append('fichiers', file);
    });

    return fd;
  }

  /**
   * Construit le FormData pour la mise à jour
   */
  private buildUpdateFormData(payload: any): FormData {
    const fd = this.buildCreateFormData(payload);

    if (this.removedExisting.size > 0) {
      fd.append(
        'removedFiles',
        JSON.stringify(Array.from(this.removedExisting))
      );
    }

    return fd;
  }

  /**
   * Réinitialise le formulaire
   */
  private resetForm(): void {
    this.form.reset();
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    this.files = [];
    this.clearNewFileUrls();
    this.removedExisting.clear();
    this.previewFiles = [];
  }

  /**
   * Retour à la sélection de catégorie
   */
  backToCategories(): void {
    this.router.navigate(['/annonces/publier']);
  }

  // ============================================
  // GESTION DES FICHIERS
  // ============================================

  async onfileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const list = Array.from(input.files || []);

    this.fileSizeError = null;

    // Vérifier les formats vidéo non supportés
    const unsupportedVideoFormats = list.filter((file) => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['avi', 'wmv', 'flv', 'mov'].includes(ext || '');
    });

    if (unsupportedVideoFormats.length > 0) {
      const formatList = unsupportedVideoFormats
        .map((f) => {
          const ext = f.name.split('.').pop()?.toUpperCase();
          return `${f.name} (${ext})`;
        })
        .join(', ');

      await SweetAlert.fire({
        icon: 'warning',
        title: 'Format non supporté',
        html: `
        <div class="text-start">
          <p>Les formats vidéo suivants ne sont pas supportés pour le découpage :</p>
          <ul class="list-unstyled mb-3">
            ${unsupportedVideoFormats
              .map(
                (f) => `
              <li class="mb-2">
                <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                <strong>${f.name}</strong>
              </li>
            `
              )
              .join('')}
          </ul>
          <div class="alert alert-info mb-0">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Formats recommandés :</strong> MP4, WebM, OGG
            <br>
            <small class="text-muted">Convertissez vos vidéos avec un outil comme HandBrake ou FFmpeg</small>
          </div>
        </div>
      `,
        confirmButtonText: 'Compris',
      });
      input.value = '';
      return;
    }

    // Vérifier la taille individuelle
    const oversizedFiles = list.filter(
      (file) => file.size > this.MAX_INDIVIDUAL_FILE_SIZE
    );

    if (oversizedFiles.length > 0) {
      this.fileSizeError = `Certains fichiers dépassent la limite de ${this.formatFileSize(
        this.MAX_INDIVIDUAL_FILE_SIZE
      )} par fichier`;
      input.value = '';
      return;
    }

    // Vérifier la taille totale
    const totalSize = list.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > this.MAX_FILE_SIZE) {
      this.fileSizeError = `La taille totale des fichiers (${this.formatFileSize(
        totalSize
      )}) dépasse la limite de ${this.formatFileSize(this.MAX_FILE_SIZE)}`;
      SweetAlert.fire({
        icon: 'error',
        text: this.fileSizeError,
        title: 'Taille excédée',
      });
      input.value = '';
      return;
    }

    // Séparer les vidéos et les autres fichiers
    const videoFiles = list.filter((file) => file.type.startsWith('video/'));
    const nonVideoFiles = list.filter(
      (file) => !file.type.startsWith('video/')
    );

    if (videoFiles.length > 0) {
      // Vérifier la durée des vidéos
      const videoChecks = await Promise.all(
        videoFiles.map(async (file) => {
          try {
            const duration = await this.getVideoDuration(file);
            const needsTrim = duration > this.MAX_VIDEO_DURATION;
            const url = URL.createObjectURL(file);
            return { file, url, duration, needsTrim, error: false };
          } catch (error) {
            console.error(`Erreur lecture vidéo ${file.name}:`, error);
            return {
              file,
              url: '',
              duration: 0,
              needsTrim: false,
              error: true,
            };
          }
        })
      );

      // Filtrer les vidéos en erreur
      const errorVideos = videoChecks.filter((v) => v.error);
      if (errorVideos.length > 0) {
        await SweetAlert.fire({
          icon: 'error',
          title: 'Vidéos illisibles',
          html: `
          <div class="text-start">
            <p>Impossible de lire les métadonnées de ces vidéos :</p>
            <ul class="list-unstyled mb-3">
              ${errorVideos
                .map(
                  (v) => `
                <li class="mb-2">
                  <i class="fas fa-times-circle text-danger me-2"></i>
                  <strong>${v.file.name}</strong>
                </li>
              `
                )
                .join('')}
            </ul>
            <div class="alert alert-info mb-0">
              <i class="fas fa-info-circle me-2"></i>
              Vérifiez que le format est supporté (MP4, WebM, OGG)
            </div>
          </div>
        `,
          confirmButtonText: 'Compris',
        });
        input.value = '';
        return;
      }

      const validVideoChecks = videoChecks.filter((v) => !v.error);
      const videosNeedingTrim = validVideoChecks.filter((v) => v.needsTrim);

      if (videosNeedingTrim.length > 0) {
        const result = await SweetAlert.fire({
          icon: 'warning',
          title: 'Vidéos trop longues',
          html: `
          <div class="text-start">
            <p><strong>${
              videosNeedingTrim.length
            } vidéo(s)</strong> dépassent la durée maximale de ${
            this.MAX_VIDEO_DURATION
          } secondes :</p>
            <ul class="list-unstyled mb-3">
              ${videosNeedingTrim
                .map(
                  (v) => `
                <li class="mb-2">
                  <i class="fas fa-video text-warning me-2"></i>
                  <strong>${v.file.name}</strong><br>
                  <small class="text-muted ms-4">Durée: ${Math.round(
                    v.duration
                  )}s / Max: ${this.MAX_VIDEO_DURATION}s</small>
                </li>
              `
                )
                .join('')}
            </ul>
            <div class="alert alert-info mb-0">
              <i class="fas fa-cut me-2"></i>
              Voulez-vous découper ces vidéos maintenant ?
            </div>
          </div>
        `,
          showCancelButton: true,
          confirmButtonText:
            '<i class="fas fa-cut me-1"></i> Découper les vidéos',
          cancelButtonText: 'Annuler',
          confirmButtonColor: '#2f4e32',
        });

        if (result.isConfirmed) {
          // IMPORTANT: Ajouter d'abord les fichiers qui ne nécessitent PAS de découpage
          const okVideos = validVideoChecks.filter((v) => !v.needsTrim);
          const filesToAdd = [...nonVideoFiles, ...okVideos.map((v) => v.file)];

          // Ajouter ces fichiers immédiatement
          this.files = [...this.files, ...filesToAdd];

          // Créer les previews pour les fichiers OK
          filesToAdd.forEach((file) => {
            const url = URL.createObjectURL(file);
            this.objectUrlToFile.set(url, file);

            const kind = kindFromMimeOrName(file.type, file.name);
            this.fileUrls.push({
              url,
              id: url,
              name: file.name,
              mime: file.type || guessMime(file.name),
              kind:
                kind === 'image' || kind === 'audio' || kind === 'video'
                  ? kind
                  : undefined,
              __revoke__: () => URL.revokeObjectURL(url),
            });
          });

          // Préparer les vidéos à découper (sans les ajouter à this.files)
          this.videosToTrim = videosNeedingTrim.map((v) => ({
            file: v.file,
            url: v.url,
            needsTrim: true,
          }));

          // Mettre à jour la preview
          this.recomputePreview();

          // Commencer le découpage
          this.startTrimmingNextVideo();
          input.value = '';
          return;
        } else {
          // Annulation - nettoyer les URLs
          validVideoChecks.forEach((v) => URL.revokeObjectURL(v.url));
          input.value = '';
          return;
        }
      }

      // Toutes les vidéos sont OK, nettoyer les URLs temporaires
      validVideoChecks.forEach((v) => URL.revokeObjectURL(v.url));
    }

    // Tout est OK, ajouter tous les fichiers
    this.files = [...this.files, ...list];

    // Créer les previews
    list.forEach((file) => {
      const url = URL.createObjectURL(file);
      this.objectUrlToFile.set(url, file);

      const kind = kindFromMimeOrName(file.type, file.name);
      this.fileUrls.push({
        url,
        id: url,
        name: file.name,
        mime: file.type || guessMime(file.name),
        kind:
          kind === 'image' || kind === 'audio' || kind === 'video'
            ? kind
            : undefined,
        __revoke__: () => URL.revokeObjectURL(url),
      });
    });

    this.recomputePreview();
    this.syncNativeFileInput();

    if (videoFiles.length > 0) {
      Toast.fire({
        icon: 'success',
        title: `${videoFiles.length} vidéo(s) validée(s)`,
        timer: 2000,
      });
    }
  }

  hydrateExistingFiles(urls: string[]): void {
    this.existingFiles = (Array.isArray(urls) ? urls : [])
      .filter((u) => !!u)
      .map((u) => {
        const id = stableIdFromUrl(u);
        const kind = guessKind(u);
        return {
          url: u,
          id,
          name: baseName(u),
          mime: guessMime(u),
          kind:
            kind === 'image' || kind === 'audio' || kind === 'video'
              ? kind
              : undefined,
        };
      });
    this.recomputePreview();
  }

  onRemovePreview = (val: string): void => {
    // Fichier existant
    const exIdx = this.existingFiles.findIndex(
      (f) => f.id === val || f.url === val
    );
    if (exIdx > -1) {
      const ex = this.existingFiles[exIdx];
      this.existingFiles.splice(exIdx, 1);
      this.removedExisting.add(ex.id);
      this.recomputePreview();
      return;
    }

    // Nouveau fichier
    const nuIdx = this.fileUrls.findIndex((f) => f.id === val || f.url === val);
    if (nuIdx > -1) {
      const item = this.fileUrls[nuIdx];
      item.__revoke__?.();
      this.fileUrls.splice(nuIdx, 1);

      const file = this.objectUrlToFile.get(item.url);
      if (file) {
        this.files = this.files.filter((f) => f !== file);
        this.objectUrlToFile.delete(item.url);
        this.syncNativeFileInput();
      }
      this.recomputePreview();
    }
  };

  private clearNewFileUrls(): void {
    this.fileUrls.forEach((p) => p.__revoke__?.());
    this.fileUrls = [];
  }

  private recomputePreview(): void {
    const merged = [...this.existingFiles, ...this.fileUrls];
    const map = new Map<string, PreviewItem>();
    for (const f of merged) {
      map.set(f.id, f);
    }
    this.previewFiles = Array.from(map.values());
  }

  private syncNativeFileInput(): void {
    if (!this.fileInput) return;
    const dt = new DataTransfer();
    for (const f of this.files) {
      dt.items.add(f);
    }
    this.fileInput.nativeElement.files = dt.files;
  }

  // ============================================
  // HELPERS POUR LE TEMPLATE
  // ============================================

  /**
   * Vérifie si une valeur est dans un tableau (pour checkbox/multiselect)
   */
  isInArray(key: string, value: string): boolean {
    const ctrl = this.form.get(key);
    const v = ctrl?.value;
    return Array.isArray(v) && v.includes(value);
  }

  /**
   * Gère le toggle d'une checkbox dans un multiselect
   */
  onMultiToggle(key: string, value: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement)?.checked ?? false;
    const ctrl = this.form.get(key);
    if (!ctrl) return;

    const cur = Array.isArray(ctrl.value) ? [...ctrl.value] : [];
    const idx = cur.indexOf(value);

    if (checked && idx === -1) cur.push(value);
    if (!checked && idx > -1) cur.splice(idx, 1);

    ctrl.setValue(cur);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity({ onlySelf: true });
  }

  /**
   * Gère le changement d'état d'un toggle
   */
  onToggleChange(key: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement)?.checked ?? false;
    this.form.get(key)?.setValue(checked);
  }

  /**
   * Récupère le label d'erreur pour un champ
   */
  getErrorMessage(categoryField: CategoryField): string {
    const field = categoryField.field;
    const control = this.form.get(field.key);

    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) {
      return 'Ce champ est obligatoire';
    }
    if (control.errors['minlength']) {
      return `Minimum ${field.minLength} caractères`;
    }
    if (control.errors['maxlength']) {
      return `Maximum ${field.maxLength} caractères`;
    }
    if (control.errors['min']) {
      return `Valeur minimum: ${field.minValue}`;
    }
    if (control.errors['max']) {
      return `Valeur maximum: ${field.maxValue}`;
    }
    if (control.errors['pattern']) {
      return 'Format invalide';
    }

    return 'Champ invalide';
  }

  /**
   * Formate une taille en bytes en format lisible
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      const timeout = setTimeout(() => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Timeout lors de la lecture de la vidéo'));
      }, 10000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(video.src);

        if (isNaN(video.duration) || video.duration === Infinity) {
          reject(new Error('Durée invalide'));
          return;
        }

        resolve(video.duration);
      };

      video.onerror = (e) => {
        clearTimeout(timeout);
        URL.revokeObjectURL(video.src);
        reject(new Error('Impossible de lire la vidéo - format non supporté'));
      };

      try {
        video.src = URL.createObjectURL(file);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
  private startTrimmingNextVideo(): void {
    if (this.videosToTrim.length === 0) {
      Toast.fire({
        icon: 'success',
        title: 'Toutes les vidéos ont été découpées !',
      });
      return;
    }

    const videoData = this.videosToTrim[0];
    this.currentVideoToTrim = {
      file: videoData.file,
      url: videoData.url,
      index: 0,
    };
    this.showVideoTrimmer = true;
  }

  onVideoTrimmed(trimmedFile: File): void {
    if (!this.currentVideoToTrim) return;

    this.files.push(trimmedFile);

    const url = URL.createObjectURL(trimmedFile);
    this.objectUrlToFile.set(url, trimmedFile);

    const kind = kindFromMimeOrName(trimmedFile.type, trimmedFile.name);
    this.fileUrls.push({
      url,
      id: url,
      name: trimmedFile.name,
      mime: trimmedFile.type,
      kind: kind === 'video' ? 'video' : undefined,
      __revoke__: () => URL.revokeObjectURL(url),
    });

    URL.revokeObjectURL(this.currentVideoToTrim.url);

    this.videosToTrim.shift();

    this.currentVideoToTrim = null;
    this.showVideoTrimmer = false;

    if (this.videosToTrim.length > 0) {
      setTimeout(() => {
        this.startTrimmingNextVideo();
      }, 300);
    } else {
      this.recomputePreview();
      this.syncNativeFileInput();
      Toast.fire({
        icon: 'success',
        title: 'Découpage terminé !',
        text: 'Vous pouvez maintenant publier votre annonce',
      });
    }
  }

  onTrimmerClosed(): void {
    if (this.currentVideoToTrim) {
      URL.revokeObjectURL(this.currentVideoToTrim.url);
    }

    this.videosToTrim.forEach((v) => URL.revokeObjectURL(v.url));
    this.videosToTrim = [];
    this.currentVideoToTrim = null;
    this.showVideoTrimmer = false;

    Toast.fire({
      icon: 'info',
      title: 'Découpage annulé',
    });
  }

  hasVideoFiles(): boolean {
    return this.files?.some((f) => f.type.startsWith('video/')) ?? false;
  }
}
