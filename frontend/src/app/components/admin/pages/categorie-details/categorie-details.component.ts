import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminApi } from '../../data/admin-api.service';
import { SweetAlert } from '../../../../helpers/sweet-alert';

interface CategoryField {
  fieldId: number;
  field: {
    id: number;
    key: string;
    label: string;
    inputType: string;
  };
  order: number;
  required: boolean;
  visibleInFilter: boolean;
  visibleInForm: boolean;
  visibleInList: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  active: boolean;
  categoryFields: CategoryField[];
}

@Component({
  selector: 'app-categorie-details',
  imports: [CommonModule],
  templateUrl: './categorie-details.component.html',
  styleUrl: './categorie-details.component.css',
})
export class CategorieDetailsComponent implements OnInit {
  category: Category | null = null;
  categoryId: number | null = null;
  fields: CategoryField[] = [];
  draggedIndex: number | null = null;
  loading = false;
  saving = false;
  hasChanges = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: AdminApi
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.categoryId = +params['id'];
      if (this.categoryId) {
        this.loadCategoryDetails();
      }
    });
  }

  loadCategoryDetails() {
    this.loading = true;
    this.api.findData('catalog/categories', this.categoryId!).subscribe({
      next: (res) => {
        this.category = res.data;
        this.fields = (res.data.categoryFields || []).sort(
          (a: CategoryField, b: CategoryField) => a.order - b.order
        );
        this.loading = false;
        this.hasChanges = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        SweetAlert.fire({
          title: 'Erreur',
          text: 'Impossible de charger les détails de la catégorie',
          icon: 'error',
        });
      },
    });
  }

  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    event.dataTransfer!.effectAllowed = 'move';
    const target = event.target as HTMLElement;
    target.classList.add('dragging');
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';

    if (this.draggedIndex !== null && this.draggedIndex !== index) {
      const target = event.currentTarget as HTMLElement;
      target.classList.add('drag-over');
    }
  }

  onDragLeave(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
  }

  onDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();

    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');

    if (this.draggedIndex === null || this.draggedIndex === dropIndex) {
      return;
    }

    const draggedItem = this.fields[this.draggedIndex];
    this.fields.splice(this.draggedIndex, 1);
    this.fields.splice(dropIndex, 0, draggedItem);

    this.updateOrders();
    this.hasChanges = true;
    this.draggedIndex = null;
  }

  onDragEnd(event: DragEvent) {
    const target = event.target as HTMLElement;
    target.classList.remove('dragging');

    document.querySelectorAll('.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });

    this.draggedIndex = null;
  }

  moveUp(index: number) {
    if (index === 0) return;
    [this.fields[index], this.fields[index - 1]] = [
      this.fields[index - 1],
      this.fields[index],
    ];
    this.updateOrders();
    this.hasChanges = true;
  }

  moveDown(index: number) {
    if (index === this.fields.length - 1) return;
    [this.fields[index], this.fields[index + 1]] = [
      this.fields[index + 1],
      this.fields[index],
    ];
    this.updateOrders();
    this.hasChanges = true;
  }

  updateOrders() {
    this.fields = this.fields.map((field, idx) => ({
      ...field,
      order: idx,
    }));
  }

  saveOrder() {
    if (!this.categoryId || this.saving) return;

    const updates = this.fields.map((field) => ({
      fieldId: field.fieldId,
      order: field.order,
    }));

    this.saving = true;
    this.saving = false;

    this.api
      .updateData('catalog/categories/reorder', this.categoryId, {
        fields: updates,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.hasChanges = false;
          SweetAlert.fire({
            title: 'Succès!',
            text: "L'ordre des champs a été mis à jour",
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          console.error(err);
          this.saving = false;
          SweetAlert.fire({
            title: 'Erreur',
            text: "Impossible de sauvegarder l'ordre",
            icon: 'error',
          });
        },
      });
  }

  resetOrder() {
    SweetAlert.fire({
      title: 'Annuler les modifications ?',
      text: "L'ordre sera restauré à son état initial",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadCategoryDetails();
      }
    });
  }

  goBack() {
    if (this.hasChanges) {
      SweetAlert.fire({
        title: 'Modifications non sauvegardées',
        text: 'Voulez-vous sauvegarder avant de quitter ?',
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        denyButtonColor: '#dc3545',
        confirmButtonText: 'Sauvegarder',
        denyButtonText: 'Quitter sans sauvegarder',
        cancelButtonText: 'Annuler',
      }).then((result) => {
        if (result.isConfirmed) {
          this.saveOrder();
          setTimeout(() => {
            this.router.navigate(['/admin/categories']);
          }, 500);
        } else if (result.isDenied) {
          this.router.navigate(['/admin/categories']);
        }
      });
    } else {
      this.router.navigate(['/admin/categories']);
    }
  }

  getInputTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      text: 'Texte',
      textarea: 'Zone de texte',
      number: 'Nombre',
      select: 'Liste déroulante',
      radio: 'Boutons radio',
      checkbox: 'Cases à cocher',
      date: 'Date',
      email: 'Email',
      tel: 'Téléphone',
      url: 'URL',
      file: 'Fichier',
      image: 'Image',
      password: 'Mot de passe',
    };
    return labels[type] || type;
  }

  getInputTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      text: 'fa-font',
      textarea: 'fa-align-left',
      number: 'fa-hashtag',
      select: 'fa-list',
      radio: 'fa-circle-dot',
      checkbox: 'fa-check-square',
      date: 'fa-calendar',
      email: 'fa-envelope',
      tel: 'fa-phone',
      url: 'fa-link',
      file: 'fa-file',
      image: 'fa-image',
      password: 'fa-lock',
    };
    return icons[type] || 'fa-circle';
  }
}
