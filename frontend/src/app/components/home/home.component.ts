import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  categories: any[] = [];
  constructor(private readonly api: ApiService<any>) {}

  ngOnInit(): void {
    this.api.getAll({ endpoint: 'categories' }).subscribe({
      next: (res: any) => {
        this.categories = res.data;
      },
      error: (err) => console.error(err),
    });
  }

  getIcon(slug: string) {
    let iconClass: string;
    switch (slug) {
      case 'musiciens':
        iconClass = 'fas fa-music';
        break;
      case 'instruments':
        iconClass = 'fa-solid fa-guitar';
        break;
      case 'cours':
        iconClass = 'fa-solid fa-chalkboard';
        break;
      case 'professionnels':
        iconClass = 'fas fa-chalkboard-teacher';
        break;
      case 'studios':
        iconClass = 'fas fa-microphone';
        break;
      case 'divers':
        iconClass = 'fa-solid fa-sliders';
        break;
      default:
        iconClass = 'fas fa-music';
        break;
    }
    return iconClass;
  }
}
