import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminApi } from '../../../data/admin-api.service';

@Component({
  selector: 'app-categorie-form',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './categorie-form.component.html',
  styleUrl: './categorie-form.component.css',
})
export class CategorieFormComponent implements OnInit {
  CategoryForm: FormGroup;
  isSubmit: boolean = false;
  buttonLabel: string = 'Créer';
  categoryId: number | null = null;
  headerText = 'Nouvelle';
  subHeaderText = 'créer une nouvelle catégorie';
  constructor(
    private readonly api: AdminApi,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.CategoryForm = this.fb.group({
      name: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.categoryId = parseInt(params.get('id') as string);
      if (this.categoryId) {
        this.api.findResource('categories', this.categoryId).subscribe({
          next: (res) => {
            this.buttonLabel = 'Modifier';
            this.headerText = 'Modifier la';
            this.subHeaderText = `mofidier la category N°${this.categoryId}`;
            this.CategoryForm.patchValue({
              name: res.data.name,
            });
          },
        });
      }
    });
  }

  onSubmit() {
    this.isSubmit = true;
    const { name } = this.CategoryForm.value;
    if (this.categoryId) {
      this.api
        .updateResource('categories', this.categoryId, { name, slug: name })
        .subscribe({
          next: () => {
            this.router.navigate(['admin/categories']);
            this.isSubmit = false;
          },
          error: (err) => {
            console.error(err);
            this.isSubmit = false;
          },
        });
    } else {
      this.api.createResource('categories', { name, slug: name }).subscribe({
        next: () => {
          this.router.navigate(['admin/categories']);
          this.isSubmit = false;
        },
        error: (err) => console.error(err),
      });
    }
  }
}
