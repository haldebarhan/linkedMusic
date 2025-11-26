import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-searchbar',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './searchbar.component.html',
  styleUrl: './searchbar.component.css',
})
export class SearchbarComponent implements OnInit {
  categories: any[] = [];
  form: FormGroup;

  constructor(
    private readonly router: Router,
    private api: ApiService<any>,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      query: [''],
      category: [''],
    });
  }

  ngOnInit(): void {
    this.api.getAll({ endpoint: 'categories' }).subscribe({
      next: (response: any) => {
        this.categories = response.items.data;
        this.form.patchValue({
          category:
            this.categories.find((c) => c.slug === 'musiciens').slug ??
            this.categories[0].slug,
        });
      },
      error: (error) => console.error('Error fetching categories: ', error),
    });
  }

  createAnnouncement() {
    this.router.navigate(['/annonces/publier']);
  }

  goToMyAnnouncements() {
    this.router.navigate(['profile/announcements']);
  }

  onSubmit() {
    const { category, query } = this.form.value;
    this.router.navigate(['announcements', category], {
      queryParams: { q: query },
    });
  }
}
