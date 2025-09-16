import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdminApi } from '../../../data/admin-api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-service-form',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './service-form.component.html',
  styleUrl: './service-form.component.css',
})
export class ServiceFormComponent implements OnInit {
  categories: any[] = [];
  serviceForm: FormGroup;
  isSubmit: boolean = false;
  serviceId: number | null = null;
  headerText = 'Nouveau';
  subHeaderText = 'créer une nouveau service-type';
  buttonLabel: string = 'Créer';

  constructor(
    private readonly api: AdminApi,
    private readonly fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.serviceForm = this.fb.group({
      name: new FormControl('', [Validators.required]),
      category: new FormControl('', [Validators.required]),
    });
  }
  ngOnInit(): void {
    this.loadCategories();

    this.route.paramMap.subscribe((params) => {
      this.serviceId = parseInt(params.get('id') as string);
      if (this.serviceId) {
        this.api.findResource('service-types', this.serviceId).subscribe({
          next: (res) => {
            this.buttonLabel = 'Modifier';
            this.headerText = 'Modifier la';
            this.subHeaderText = `mofidier le service-type N°${this.serviceId}`;
            this.serviceForm.patchValue({
              name: res.data.name,
            });
          },
        });
      }
    });
  }

  loadCategories() {
    this.api.listResources({ endpoint: 'categories' }).subscribe({
      next: (res) => {
        this.categories = res.items.data;
      },
      error: (err) => console.error(err),
    });
  }

  onSubmit() {
    this.isSubmit = true;
    const { name, category } = this.serviceForm.value;
    const categoryId: number = parseInt(category as string);
    if (this.serviceId) {
      this.api
        .updateResource('service-types', this.serviceId, {
          name,
          slug: name,
          categoryIds: [categoryId],
        })
        .subscribe({
          next: () => {
            this.router.navigate(['admin/services']);
            this.isSubmit = false;
          },
          error: (err) => {
            console.error(err);
            this.isSubmit = false;
          },
        });
    } else {
      this.api
        .createResource('service-types', {
          name,
          slug: name,
          categoryIds: [categoryId],
        })
        .subscribe({
          next: () => {
            this.router.navigate(['admin/services']);
            this.isSubmit = false;
          },
          error: (err) => console.error(err),
        });
    }
  }
}
