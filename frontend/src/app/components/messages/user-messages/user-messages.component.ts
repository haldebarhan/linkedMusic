import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { SocketService } from '../../../shared/services/socket.service';

type ThreadRow = {
  id: number;
  peerId: number;
  peerName: string;
  peerAvatar?: string | null;
  lastSnippet?: string;
  lastAt?: string; // ISO
  unreadCount?: number;
};

type MessageRow = {
  id: number;
  threadId: number;
  senderId: number;
  content: string;
  createdAt: string; // ISO
};

const EV = {
  THREADS_LIST: 'threads:list',
  THREADS_DATA: 'threads:data',
  THREAD_SELECT: 'thread:select',
  CONVO_LOAD: 'convo:load',
  CONVO_DATA: 'convo:data',
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_MARK_READ: 'message:markRead',
} as const;

@Component({
  selector: 'app-user-messages',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-messages.component.html',
  styleUrl: './user-messages.component.css',
})
export class UserMessagesComponent implements OnInit, OnDestroy, OnChanges {
  // UI
  loadingThreads = false;
  loadingMessages = false;
  sending = false;

  // Data
  threads: ThreadRow[] = [];

  lastMsgId: number | null = null;

  // fil actif (droite)
  activeThreadId: number | null = null;
  messages: MessageRow[] = [];
  peerName = '';
  peerAvatar: string | null = null;

  hasActiveSubscription: boolean = false;

  // pagination (faÃ§on Gmail)
  page = 1;
  limit = 50;
  totalMsgs = 0;
  get pageStart() {
    return this.messages.length ? (this.page - 1) * this.limit + 1 : 0;
  }
  get pageEnd() {
    return (this.page - 1) * this.limit + this.messages.length;
  }
  get hasPrev() {
    return this.page > 1;
  }
  get hasNext() {
    return this.pageEnd < this.totalMsgs;
  }

  // Form
  form!: FormGroup;

  currentUserId!: number;

  @ViewChild('scrollBottom') scrollBottomRef!: ElementRef<HTMLDivElement>;
  @ViewChild('chatScroll') private chatScrollRef!: ElementRef<HTMLDivElement>;

  constructor(
    private fb: FormBuilder,
    private api: ApiService<any>,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private socket: SocketService
  ) {
    this.auth.auth$.subscribe((user) => {
      this.currentUserId = user?.user?.id!;
      this.hasActiveSubscription = user.user?.subscriptions[0] !== undefined;
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadingThreads = true;
    this.socket.emit(EV.THREADS_LIST);
    this.socket.on<ThreadRow[]>(EV.THREADS_DATA, (rows: any) => {
      console.log('test: ', rows);
      this.threads = rows.data || [];
      this.loadingThreads = false;
      this.joinAllThreadRooms();
      this.afterRenderScrollBottom();
    });

    // Conversation chargée
    this.socket.on<{
      threadId: number;
      messages: MessageRow[];
      total: number;
    }>(EV.CONVO_DATA, (p) => {
      if (!this.hasActiveSubscription) return;
      if (p.threadId !== this.activeThreadId) return;
      this.messages = p.messages ?? [];
      this.loadingMessages = false;
      this.afterRenderScrollBottom();
    });

    // Nouveau message (reçu ou propre echo si même room)
    this.socket.on<{ threadId: number; message: MessageRow }>(
      EV.MESSAGE_NEW,
      (p) => {
        if (!this.hasActiveSubscription) return;
        // met à jour la preview
        const row = this.threads.find((t) => t.id === p.threadId);
        if (row) {
          row.lastSnippet = (p.message.content || '')
            .replace(/\s+/g, ' ')
            .slice(0, 120);
          row.lastAt = p.message.createdAt;
          if (
            p.message.senderId !== this.currentUserId &&
            p.threadId !== this.activeThreadId
          ) {
            row.unreadCount = (row.unreadCount ?? 0) + 1;
          }
        }
        if (p.threadId !== this.activeThreadId) return;
        this.messages = [...this.messages, p.message];
        this.afterRenderScrollBottom();
      }
    );
  }

  ngOnChanges(): void {
    this.syncFormEnabled();
  }

  initForm() {
    this.form = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]],
    });
  }

  ngOnDestroy(): void {
    this.socket.off(EV.THREADS_DATA);
    this.socket.off(EV.CONVO_DATA);
    this.socket.off(EV.MESSAGE_NEW);
  }

  isMine = (m: { senderId: number }) => m.senderId === this.currentUserId;

  selectThread(threadId: number) {
    if (!this.hasActiveSubscription) return;
    if (this.activeThreadId === threadId) {
      this.socket.emit(EV.CONVO_LOAD, { threadId, page: 1, limit: 200 });
      return;
    }
    this.activeThreadId = threadId;

    const row = this.threads.find((t) => t.id === threadId);
    this.peerName = row?.peerName ?? '';
    this.peerAvatar = row?.peerAvatar ?? null;
    this.page = 1;
    if (row) row.unreadCount = 0;

    this.loadingMessages = true;
    this.socket.emit(EV.THREAD_SELECT, { threadId });
    this.socket.emit(EV.CONVO_LOAD, { threadId, page: 1, limit: 200 });

    // marquer lu (redondant mais idempotent)
    this.socket.emit(EV.MESSAGE_MARK_READ, { threadId });
    queueMicrotask(() => this.scrollToBottom());
  }

  /** ----------------- Actions ----------------- */
  send() {
    if (!this.hasActiveSubscription) return;
    if (this.form.invalid || this.sending || !this.activeThreadId) return;
    const content = (this.form.value.content ?? '').trim();
    if (!content) return;
    this.sending = true;
    this.form.reset({ content: '' });
    queueMicrotask(() => this.scrollToBottom());

    // Emit
    this.socket.emit(EV.MESSAGE_SEND, {
      threadId: this.activeThreadId,
      content,
    });
    this.form.reset({ content: '' });
    this.sending = false;
  }

  onIncomingMessage(msg: MessageRow) {
    if (!this.hasActiveSubscription) return;
    this.updateThreadPreview(
      msg.threadId,
      msg.content,
      new Date(msg.createdAt)
    );

    if (msg.threadId !== this.activeThreadId) {
      const row = this.threads.find((t) => t.id === msg.threadId);
      if (row) row.unreadCount = (row.unreadCount ?? 0) + 1;
      return;
    }
    this.messages = [...this.messages, msg];
    queueMicrotask(() => this.scrollToBottom());
  }

  goToPackPlan() {
    this.router.navigate(['/pack/pricing-plan']);
  }

  private updateThreadPreview(
    threadId: number,
    lastText: string,
    lastAt = new Date()
  ) {
    const row = this.threads.find((t) => t.id === threadId);
    if (!row) return;
    row.lastSnippet = (lastText || '').replace(/\s+/g, ' ').slice(0, 120);
    row.lastAt = lastAt.toISOString();
  }

  private scrollToBottom() {
    // 1) ancre en bas si dispo
    if (this.scrollBottomRef?.nativeElement) {
      this.scrollBottomRef.nativeElement.scrollIntoView({
        behavior: 'auto',
        block: 'end',
      });
      return;
    }
    // 2) fallback: scroll direct
    if (this.chatScrollRef?.nativeElement) {
      const el = this.chatScrollRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  private joinAllThreadRooms() {
    this.threads.forEach((thread) => {
      this.socket.emit(EV.THREAD_SELECT, { threadId: thread.id });
    });
  }

  /** Appelle ça après que le DOM ait *vraiment* peint */
  private afterRenderScrollBottom() {
    // enchaîne microtask + rAF + setTimeout pour tous les cas (CD, images, fonts…)
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        setTimeout(() => this.scrollToBottom(), 0);
      });
    });
  }

  private syncFormEnabled() {
    const shouldEnable = this.hasActiveSubscription && !!this.activeThreadId;
    if (shouldEnable) {
      this.form.enable({ emitEvent: false });
    } else {
      this.form.disable({ emitEvent: false });
    }
  }
}
