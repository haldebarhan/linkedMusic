import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
export class SearchbarComponent {
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
