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
    // Auto-select first 30s or max duration when opened
  }

  ngOnDestroy(): void {
    this.stopVideo();
  }

  onVideoLoaded(): void {
    const video = this.videoPlayer.nativeElement;
    this.videoDuration = video.duration;
    this.endTime = Math.min(this.videoDuration, this.maxDuration);
    this.startTime = 0;
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

  onStartChange(): void {
    // Ensure start is before end
    if (this.startTime >= this.endTime) {
      this.startTime = Math.max(0, this.endTime - 1);
    }
    // Update video position
    if (this.videoPlayer) {
      this.videoPlayer.nativeElement.currentTime = this.startTime;
    }
  }

  onEndChange(): void {
    // Ensure end is after start
    if (this.endTime <= this.startTime) {
      this.endTime = Math.min(this.videoDuration, this.startTime + 1);
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
      this.close();
    } catch (error) {
      console.error('Erreur lors du découpage:', error);
      alert('Erreur lors du découpage de la vidéo');
    } finally {
      this.processing = false;
    }
  }

  private async extractVideoSegment(
    video: HTMLVideoElement,
    start: number,
    end: number
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;

      // Setup MediaRecorder
      const stream = canvas.captureStream(30); // 30 FPS

      // Add audio track if exists
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination);

      if (destination.stream.getAudioTracks().length > 0) {
        stream.addTrack(destination.stream.getAudioTracks()[0]);
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], this.fileName, { type: 'video/webm' });
        audioContext.close();
        resolve(file);
      };

      recorder.onerror = (e) => {
        audioContext.close();
        reject(e);
      };

      // Start recording
      video.currentTime = start;
      video.play();
      recorder.start();

      // Draw frames
      const drawFrame = () => {
        if (video.currentTime >= end) {
          recorder.stop();
          video.pause();
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Update progress
        const progress = ((video.currentTime - start) / (end - start)) * 100;
        this.processingProgress = Math.round(progress);

        requestAnimationFrame(drawFrame);
      };

      video.onseeked = () => {
        drawFrame();
      };
    });
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
