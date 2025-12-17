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
  @Input() maxDuration: number = 60;
  @Input() isOpen: boolean = false;

  @Output() trimmed = new EventEmitter<File>();
  @Output() closed = new EventEmitter<void>();

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
      video.addEventListener(
        'seeked',
        () => {
          console.log('Seek to start completed:', video.currentTime);
        },
        { once: true }
      );
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

  selectMiddle30s(): void {
    const middle = this.videoDuration / 2;
    this.startTime = Math.max(0, middle - 15);
    this.endTime = Math.min(this.videoDuration, middle + 15);
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

    try {
      const video = this.videoPlayer.nativeElement;
      const trimmedFile = await this.extractVideoSegment(
        video,
        this.startTime,
        this.endTime
      );

      this.trimmed.emit(trimmedFile);
    } catch (error) {
      console.error('Erreur lors du découpage:', error);
      alert('Erreur lors du découpage de la vidéo');
    } finally {
      this.processing = false;
    }
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

  private async extractVideoSegment(
    video: HTMLVideoElement,
    start: number,
    end: number
  ): Promise<File> {
    console.log('Starting extract from', start, 'to', end);

    // Canvas pour le rendu vidéo
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;

    const videoStream = (video as any).captureStream();

    const canvasStream = canvas.captureStream(30);

    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...videoStream.getAudioTracks(), // AUDIO OK
    ]);

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: 2_500_000,
    });

    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], this.fileName, { type: 'video/webm' });
        console.log('Recording stopped');
        resolve(file);
      };

      recorder.onerror = (e) => {
        console.error('Recorder error:', e);
        reject(e);
      };

      const drawFrame = () => {
        if (video.currentTime >= end) {
          recorder.stop();
          video.pause();
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const progress = ((video.currentTime - start) / (end - start)) * 100;
        this.processingProgress = Math.round(progress);

        requestAnimationFrame(drawFrame);
      };

      video.pause();
      video.currentTime = start;

      const onSeeked = async () => {
        video.removeEventListener('seeked', onSeeked);

        try {
          recorder.start();
          await video.play();
          requestAnimationFrame(drawFrame);
        } catch (err) {
          reject(err);
        }
      };

      video.addEventListener('seeked', onSeeked);
    });
  }
}
