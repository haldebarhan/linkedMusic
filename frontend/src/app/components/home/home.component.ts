import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { CommonModule } from '@angular/common';
import { BannerSlide } from '../admin/pages/banner-slides/banner-slides.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  categories: any[] = [];
  bannerSlides: BannerSlide[] = [];
  currentSlideIndex = 0;
  private autoSlideInterval: any;

  constructor(private readonly api: ApiService<any>) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadBannerSlides();
  }

  ngOnDestroy(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  loadCategories(): void {
    this.api.getAll({ endpoint: 'categories' }).subscribe({
      next: (res: any) => {
        this.categories = res.items.data;
      },
      error: (err) => console.error(err),
    });
  }

  loadBannerSlides() {
    this.api.getAll({ endpoint: 'banner-slides' }).subscribe({
      next: (res: any) => {
        this.bannerSlides = res.data;
        if (this.bannerSlides.length > 0) {
          this.startAutoSlide();
        }
      },
      error: (err) => {
        console.error('Erreur chargement bannières:', err);
        this.bannerSlides = [
          {
            id: 0,
            title: 'Bienvenue',
            description: 'Découvrez notre plateforme musicale',
            mediaType: 'image',
            mediaUrl:
              'https://www.baltana.com/files/wallpapers-11/Imagine-Dragons-Wallpaper-HD-30579.jpg',
            order: 1,
            isActive: true,
          },
        ];
      },
    });
  }

  startAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }

    if (this.bannerSlides.length > 1) {
      this.autoSlideInterval = setInterval(() => {
        this.nextSlide();
      }, 5000);
    }
  }

  stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  nextSlide(): void {
    this.currentSlideIndex =
      (this.currentSlideIndex + 1) % this.bannerSlides.length;
    this.onSlideChange();
  }

  prevSlide(): void {
    this.currentSlideIndex =
      (this.currentSlideIndex - 1 + this.bannerSlides.length) %
      this.bannerSlides.length;
    this.onSlideChange();
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
    this.startAutoSlide();
    this.onSlideChange();
  }

  pauseAutoSlide(): void {
    this.stopAutoSlide();
  }

  resumeAutoSlide(): void {
    this.startAutoSlide();
  }

  // Méthode appelée quand une vidéo est chargée
  onVideoLoaded(event: Event, slideIndex: number): void {
    const video = event.target as HTMLVideoElement;

    // Si c'est la slide active, jouer la vidéo
    if (slideIndex === this.currentSlideIndex) {
      video.play().catch((err) => {
        console.log('Erreur lecture vidéo:', err);
      });
    } else {
      // Sinon, s'assurer qu'elle est en pause
      video.pause();
      video.currentTime = 0;
    }
  }

  // Méthode pour gérer la lecture/pause quand la slide change
  onSlideChange(): void {
    // Récupérer toutes les vidéos dans le carousel (pas les images !)
    const videos = document.querySelectorAll<HTMLVideoElement>(
      '.carousel-container video'
    );

    videos.forEach((video) => {
      // Mettre toutes les vidéos en pause
      video.pause();
      video.currentTime = 0;

      // Trouver la slide parente de cette vidéo
      const slideElement = video.closest('.carousel-slide');
      const slideIndexAttr = slideElement?.getAttribute('data-slide-index');

      // Si c'est la vidéo de la slide active, la jouer
      if (
        slideIndexAttr &&
        parseInt(slideIndexAttr) === this.currentSlideIndex
      ) {
        video.play().catch((err) => {
          console.log('Erreur lecture vidéo:', err);
        });
      }
    });
  }

  getIcon(slug: string): string {
    const iconMap: { [key: string]: string } = {
      musiciens: 'fas fa-music',
      instruments: 'fa-solid fa-guitar',
      cours: 'fa-solid fa-chalkboard',
      producteurs: 'fa-solid fa-headphones',
      'ingenieurs-son': 'fa-solid fa-record-vinyl',
      studios: 'fas fa-microphone',
      divers: 'fa-solid fa-sliders',
      djs: 'fa-solid fa-circle-play',
    };

    return iconMap[slug] || 'fas fa-music';
  }
}
