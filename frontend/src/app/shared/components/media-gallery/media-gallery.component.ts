import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { baseName, pathPart } from '../../../helpers/path-part';

// Entrées possibles: string (URL) ou objet
type RawMedia =
  | string
  | {
      url?: string;
      key?: string;
      mime?: string;
      kind?: 'image' | 'audio' | 'video';
      name?: string;
      thumbUrl?: string;
    };

type MediaFile = {
  url: string;
  key?: string;
  mime?: string;
  kind?: 'image' | 'audio' | 'video';
  name?: string;
  thumbUrl?: string;
};

@Component({
  selector: 'app-media-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-gallery.component.html',
  styleUrls: ['./media-gallery.component.css'],
})
export class MediaGalleryComponent implements AfterViewInit, OnDestroy {
  lightboxOpen = false;
  lightboxZoom = 1; // 1 = taille naturelle
  lightboxTranslate = { x: 0, y: 0 };

  /** Normalisation */
  private _files: MediaFile[] = [];
  @Input() autoplay = { audio: true, video: false };
  @Input() set files(value: RawMedia[]) {
    const arr = Array.isArray(value) ? value : [];
    this._files = arr
      .map((v): MediaFile | null => {
        if (!v) return null;
        if (typeof v === 'string') {
          const url = v.trim();
          return url ? { url } : null;
        }
        const url = (v.url ?? '').toString().trim();
        return url
          ? {
              url,
              key: v.key,
              mime: v.mime,
              kind: v.kind,
              name: v.name,
              thumbUrl: v.thumbUrl,
            }
          : null;
      })
      .filter(Boolean) as MediaFile[];
    if (!this._files.length) this.selectedIndex = -1;
    else if (this.selectedIndex < 0 || this.selectedIndex >= this._files.length)
      this.selectedIndex = 0;
  }
  get files(): MediaFile[] {
    return this._files;
  }

  @ViewChild('videoEl') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('audioEl') audioRef?: ElementRef<HTMLAudioElement>;

  selectedIndex = 0;
  get selected(): MediaFile | null {
    return this.selectedIndex >= 0 && this.selectedIndex < this.files.length
      ? this.files[this.selectedIndex]
      : null;
  }

  // état lecteur
  isPlaying = false;
  duration = 0;
  currentTime = 0;
  volume = 1;
  muted = false;

  // cycle
  ngAfterViewInit(): void {
    this.bindMediaEvents();
    this.loadSelected();
  }
  ngOnDestroy(): void {
    this.unbindMediaEvents();
  }
  ngOnChanges(_: SimpleChanges): void {
    // si l'@Input files change après init
    queueMicrotask(() => this.loadSelected());
  }

  // utils
  typeOf(f: MediaFile | null): 'image' | 'audio' | 'video' | 'other' {
    if (!f) return 'other';
    if (f.kind) return f.kind;
    const mime = (f.mime ?? '').toLowerCase();
    const p = pathPart(f.url);
    if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(p))
      return 'image';
    if (mime.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|flac)$/.test(p))
      return 'audio';
    if (mime.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/.test(p))
      return 'video';
    return 'other';
  }
  labelOf(f: MediaFile, idx: number) {
    return f.name || baseName(f.key || f.url) || `Fichier ${idx + 1}`;
  }
  iconOf(f: MediaFile) {
    switch (this.typeOf(f)) {
      case 'image':
        return '🖼️';
      case 'audio':
        return '🎵';
      case 'video':
        return '🎬';
      default:
        return '📄';
    }
  }
  trackByUrl = (_: number, f: MediaFile) => f.key ?? f.url;

  // playlist
  select(i: number) {
    if (i < 0 || i >= this.files.length) return;
    this.selectedIndex = i;
    this.loadSelected();
  }
  next() {
    if (this.files.length) {
      this.selectedIndex = (this.selectedIndex + 1) % this.files.length;
      this.loadSelected();
    }
  }
  prev() {
    if (this.files.length) {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.files.length) % this.files.length;
      this.loadSelected();
    }
  }

  // chargement du média courant
  private loadSelected() {
    const f = this.selected;
    this.isPlaying = false;
    this.duration = 0;
    this.currentTime = 0;

    const video = this.videoRef?.nativeElement;
    const audio = this.audioRef?.nativeElement;

    // reset
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }

    if (!f) return;

    const kind = this.typeOf(f);
    // image: rien à charger dans les players
    if (kind === 'image') return;

    if (kind === 'video' && video) {
      video.src = f.url;
      video.load();
      // autoplay à la sélection (optionnel)
      if (this.autoplay.video) video.play().catch(() => {});
      return;
    }
    if (kind === 'audio' && audio) {
      audio.src = f.url;
      audio.load();
      if (this.autoplay.video) audio.play().catch(() => {});
      return;
    }
  }

  // événements média
  private onTimeUpdate = () => {
    const el = this.currentMediaEl();
    if (!el) return;
    this.currentTime = el.currentTime || 0;
    this.duration = el.duration || 0;
  };
  private onPlay = () => {
    this.isPlaying = true;
  };
  private onPause = () => {
    this.isPlaying = false;
  };
  private onEnded = () => {
    this.isPlaying = false;
  };

  private bindMediaEvents() {
    const v = this.videoRef?.nativeElement;
    const a = this.audioRef?.nativeElement;
    [v, a].forEach((el) => {
      if (!el) return;
      el.addEventListener('timeupdate', this.onTimeUpdate);
      el.addEventListener('loadedmetadata', this.onTimeUpdate);
      el.addEventListener('play', this.onPlay);
      el.addEventListener('pause', this.onPause);
      el.addEventListener('ended', this.onEnded);
      el.volume = this.volume;
      el.muted = this.muted;
    });
  }
  private unbindMediaEvents() {
    const v = this.videoRef?.nativeElement;
    const a = this.audioRef?.nativeElement;
    [v, a].forEach((el) => {
      if (!el) return;
      el.removeEventListener('timeupdate', this.onTimeUpdate);
      el.removeEventListener('loadedmetadata', this.onTimeUpdate);
      el.removeEventListener('play', this.onPlay);
      el.removeEventListener('pause', this.onPause);
      el.removeEventListener('ended', this.onEnded);
    });
  }

  // contrôles
  currentMediaEl(): HTMLMediaElement | null {
    const f = this.selected;
    if (!f) return null;
    const kind = this.typeOf(f);
    if (kind === 'video') return this.videoRef?.nativeElement ?? null;
    if (kind === 'audio') return this.audioRef?.nativeElement ?? null;
    return null;
    // image: pas de media element
  }

  togglePlay() {
    const el = this.currentMediaEl();
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }

  seekTo(pct: number) {
    const el = this.currentMediaEl();
    if (!el || !isFinite(el.duration) || el.duration <= 0) return;
    el.currentTime = Math.min(Math.max(pct, 0), 1) * el.duration;
  }

  setVolume(v: number) {
    this.volume = Math.min(Math.max(v, 0), 1);
    const el = this.currentMediaEl();
    if (el) el.volume = this.volume;
  }

  toggleMute() {
    this.muted = !this.muted;
    const el = this.currentMediaEl();
    if (el) el.muted = this.muted;
  }

  fmtTime(sec: number): string {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  }

  getVolume(volume: number) {
    return Math.round(volume * 100);
  }

  openLightbox() {
    if (this.selected && this.typeOf(this.selected) === 'image') {
      this.lightboxOpen = true;
      this.lightboxZoom = 1;
      this.lightboxTranslate = { x: 0, y: 0 };
      // lock scroll derrière (optionnel)
      document.body.style.overflow = 'hidden';
    }
  }

  closeLightbox() {
    this.lightboxOpen = false;
    document.body.style.overflow = '';
  }

  lightboxPrev() {
    this.prev();
  }
  lightboxNext() {
    this.next();
  }

  lightboxZoomIn(step = 0.2) {
    this.lightboxZoom = Math.min(this.lightboxZoom + step, 5);
  }
  lightboxZoomOut(step = 0.2) {
    this.lightboxZoom = Math.max(this.lightboxZoom - step, 0.2);
  }
  lightboxReset() {
    this.lightboxZoom = 1;
    this.lightboxTranslate = { x: 0, y: 0 };
  }

  private dragState?: { x: number; y: number; startX: number; startY: number };
  onLightboxMouseDown(ev: MouseEvent) {
    if (this.lightboxZoom <= 1) return;
    this.dragState = {
      x: this.lightboxTranslate.x,
      y: this.lightboxTranslate.y,
      startX: ev.clientX,
      startY: ev.clientY,
    };
  }

  onLightboxMouseMove(ev: MouseEvent) {
    if (!this.dragState) return;
    const dx = ev.clientX - this.dragState.startX;
    const dy = ev.clientY - this.dragState.startY;
    this.lightboxTranslate = {
      x: this.dragState.x + dx,
      y: this.dragState.y + dy,
    };
  }
  onLightboxMouseUp() {
    this.dragState = undefined;
  }
  onLightboxWheel(ev: WheelEvent) {
    ev.preventDefault();
    const delta = -Math.sign(ev.deltaY) * 0.1; // up = zoom in
    const newZ = Math.min(Math.max(this.lightboxZoom + delta, 0.2), 5);
    this.lightboxZoom = newZ;
  }

  onLightboxKeydown(ev: KeyboardEvent) {
    if (!this.lightboxOpen) return;
    if (ev.key === 'Escape') this.closeLightbox();
    else if (ev.key === 'ArrowLeft') this.lightboxPrev();
    else if (ev.key === 'ArrowRight') this.lightboxNext();
  }
}
