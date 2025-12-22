import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-video-trimmer',
  imports: [CommonModule, FormsModule],
  templateUrl: './video-trimmer.component.html',
  styleUrl: './video-trimmer.component.css',
})
export class VideoTrimmerComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  @Input() videoUrl: string = '';
  @Input() fileName: string = '';
  @Input() maxDuration: number = 55;
  @Input() isOpen: boolean = false;
  @Input() fileSize: number = 0;

  @Output() trimmed = new EventEmitter<File>();
  @Output() closed = new EventEmitter<void>();
  @Output() validated = new EventEmitter<{ start: number; end: number }>();

  videoDuration: number = 0;
  currentTime: number = 0;
  startTime: number = 0;
  endTime: number = 0;
  isPlaying: boolean = false;
  processing: boolean = false;
  processingProgress: number = 0;

  ngOnInit(): void {
    if (this.videoPlayer) {
      const video = this.videoPlayer.nativeElement;
      video.preload = 'auto';
    }
  }

  ngOnDestroy(): void {
    this.stopVideo();
  }

  onVideoLoaded(): void {
    const video = this.videoPlayer.nativeElement;
    console.log('Video loaded, duration:', video.duration); // Log pour debug
    this.videoDuration = video.duration;
    this.endTime = Math.min(this.videoDuration, this.maxDuration);
    this.startTime = 0;
    video.addEventListener(
      'canplaythrough',
      () => {
        console.log('Video can play through - ready for trimming');
      },
      { once: true }
    );
  }

  onStartChange(): void {
    if (this.startTime >= this.endTime) {
      this.startTime = Math.max(0, this.endTime - 1);
    }
    if (this.videoPlayer) {
      const video = this.videoPlayer.nativeElement;
      video.currentTime = this.startTime;
      video.addEventListener('seeked', () => {}, { once: true });
    }
  }

  onEndChange(): void {
    if (this.endTime <= this.startTime) {
      this.endTime = Math.min(this.videoDuration, this.startTime + 1);
    }
    // Pas besoin de seek ici, car on ne joue pas forcément à end
  }

  onTimeUpdate(): void {
    const video = this.videoPlayer.nativeElement;
    this.currentTime = video.currentTime;

    if (this.currentTime >= this.endTime) {
      video.currentTime = this.startTime;
      if (!this.isPlaying) {
        video.pause();
      }
    }
  }

  togglePlay(): void {
    const video = this.videoPlayer.nativeElement;
    if (this.isPlaying) {
      video.pause();
      this.isPlaying = false;
    } else {
      // Start from selected start time
      if (
        video.currentTime < this.startTime ||
        video.currentTime >= this.endTime
      ) {
        video.currentTime = this.startTime;
      }
      video.play();
      this.isPlaying = true;
    }
  }

  stopVideo(): void {
    if (this.videoPlayer) {
      this.videoPlayer.nativeElement.pause();
      this.isPlaying = false;
    }
  }

  selectFirst30s(): void {
    this.startTime = 0;
    this.endTime = Math.min(30, this.videoDuration);
    this.videoPlayer.nativeElement.currentTime = 0;
  }

  selectLast30s(): void {
    this.startTime = Math.max(0, this.videoDuration - 30);
    this.endTime = this.videoDuration;
    this.videoPlayer.nativeElement.currentTime = this.startTime;
  }

  canTrim(): boolean {
    const duration = this.endTime - this.startTime;
    return duration > 0 && duration <= this.maxDuration;
  }

  async trimVideo(): Promise<void> {
    if (!this.canTrim()) return;

    this.processing = true;
    this.processingProgress = 0;
    this.stopVideo();
    const start = Math.floor(this.startTime);
    const end = Math.floor(this.endTime);

    console.log(`Trimming video from ${start}s to ${end}s`);

    // Émettre l'événement validated pour que le parent gère l'envoi au backend
    this.validated.emit({ start, end });

    // Fermer le modal (optionnel, mais recommandé pour UX)
    this.close();

    this.processing = false;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  close(): void {
    this.stopVideo();
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (!this.processing) {
      this.close();
    }
  }
}
