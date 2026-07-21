import { Component, signal, inject, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { WalletService } from '../../services/wallet.service';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-ora-chat',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, FormsModule],
  template: `
    @if (device.isMobile() || device.isTablet()) {
      <div class="ora-overlay">
        <div class="ora-sheet">
          <div class="ora-header">
            <div class="ora-header-left">
              <span class="ora-avatar">O</span>
              <div class="ora-header-info">
                <span class="ora-name">Ora</span>
                <span class="ora-status">Online &bull; AI Assistant</span>
              </div>
            </div>
            <button class="ora-close" (click)="close.emit()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="ora-body" #messagesContainer>
            <div class="ora-date-divider">Today</div>
            @for (msg of messages(); track msg) {
              <div class="msg-row" [class.msg-user]="msg.role === 'user'" [class.msg-ora]="msg.role === 'assistant'">
                @if (msg.role === 'assistant') { <div class="msg-avatar">O</div> }
                <div class="msg-content">
                  <div class="msg-bubble">{{ msg.content }}</div>
                  <span class="msg-time">{{ msg.time }}</span>
                </div>
              </div>
            }
            @if (loading()) {
              <div class="msg-row msg-ora">
                <div class="msg-avatar">O</div>
                <div class="msg-typing"><span class="t-dot"></span><span class="t-dot"></span><span class="t-dot"></span></div>
              </div>
            }
          </div>
          <div class="ora-footer">
            <div class="ora-input-wrap">
              <input class="ora-input" [(ngModel)]="inputText" placeholder="Type a message..." (keydown.enter)="sendMessage()" [disabled]="loading()" autofocus>
              <button class="ora-send" (click)="sendMessage()" [disabled]="!inputText.trim() || loading()">
                @if (loading()) { <mat-spinner diameter="18"></mat-spinner> } @else { <mat-icon>send</mat-icon> }
              </button>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="d-overlay">
        <div class="d-widget">
          <div class="d-header">
            <div class="d-header-left">
              <span class="ora-avatar">O</span>
              <div>
                <span class="ora-name">Ora</span>
                <span class="ora-status">AI Assistant &bull; Online</span>
              </div>
            </div>
            <button class="ora-close" (click)="close.emit()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="d-body" #messagesContainer>
            <div class="ora-date-divider">Today</div>
            @for (msg of messages(); track msg) {
              <div class="msg-row" [class.msg-user]="msg.role === 'user'" [class.msg-ora]="msg.role === 'assistant'">
                @if (msg.role === 'assistant') { <div class="msg-avatar">O</div> }
                <div class="msg-content">
                  <div class="msg-bubble">{{ msg.content }}</div>
                  <span class="msg-time">{{ msg.time }}</span>
                </div>
              </div>
            }
            @if (loading()) {
              <div class="msg-row msg-ora">
                <div class="msg-avatar">O</div>
                <div class="msg-typing"><span class="t-dot"></span><span class="t-dot"></span><span class="t-dot"></span></div>
              </div>
            }
            <div class="ora-suggestions">
              @for (s of suggestions; track s) {
                <button class="s-chip" (click)="quickQuestion(s)">{{ s }}</button>
              }
            </div>
          </div>
          <div class="d-footer">
            <div class="ora-input-wrap">
              <input class="ora-input" [(ngModel)]="inputText" placeholder="Type a message..." (keydown.enter)="sendMessage()" [disabled]="loading()">
              <button class="ora-send" (click)="sendMessage()" [disabled]="!inputText.trim() || loading()">
                @if (loading()) { <mat-spinner diameter="18"></mat-spinner> } @else { <mat-icon>send</mat-icon> }
              </button>
            </div>
            <span class="d-footer-note">Powered by BetPool AI</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :root {
      --chat-bg: #0A1428;
      --chat-surface: #0F1B30;
      --chat-bubble-ora: #1A2744;
      --chat-bubble-user: #00E676;
      --chat-text: #FFFFFF;
      --chat-muted: rgba(255,255,255,0.35);
      --chat-border: rgba(255,255,255,0.06);
      --chat-radius: 18px;
    }

    .ora-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #00E676, #00C853);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 15px; color: #0A1428; flex-shrink: 0;
    }
    .ora-name { display: block; font-weight: 700; font-size: 14px; color: #FFFFFF; line-height: 1.2; }
    .ora-status { display: block; font-size: 10.5px; color: rgba(255,255,255,0.35); letter-spacing: 0.2px; }
    .ora-close { background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .ora-close:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .ora-close mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .ora-input-wrap { display: flex; align-items: center; gap: 8px; background: #162245; border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 2px; transition: border-color 0.15s; }
    .ora-input-wrap:focus-within { border-color: rgba(0,230,118,0.3); }
    .ora-input { flex: 1; height: 36px; padding: 0 12px; background: transparent; border: none; color: #FFFFFF; font-size: 13px; outline: none; font-family: inherit; }
    .ora-input::placeholder { color: rgba(255,255,255,0.25); }
    .ora-send { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #00E676, #00C853); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; margin-right: 2px; transition: opacity 0.15s; }
    .ora-send:disabled { opacity: 0.3; cursor: not-allowed; }
    .ora-send mat-icon { font-size: 16px; width: 16px; height: 16px; color: #0A1428; }
    .ora-send mat-spinner { width: 18px !important; height: 18px !important; }

    .ora-date-divider { text-align: center; font-size: 11px; color: rgba(255,255,255,0.2); margin-bottom: 12px; position: relative; }
    .ora-date-divider::before, .ora-date-divider::after { content: ''; position: absolute; top: 50%; width: 30%; height: 1px; background: rgba(255,255,255,0.04); }
    .ora-date-divider::before { left: 0; }
    .ora-date-divider::after { right: 0; }

    .msg-row { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 6px; }
    .msg-user { flex-direction: row-reverse; }
    .msg-ora { }
    .msg-content { max-width: 78%; display: flex; flex-direction: column; }
    .msg-bubble { padding: 10px 14px; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
    .msg-ora .msg-bubble { background: #1A2744; color: rgba(255,255,255,0.88); border-radius: 4px 18px 18px 18px; }
    .msg-user .msg-bubble { background: #00E676; color: #0A1428; border-radius: 18px 4px 18px 18px; }
    .msg-time { font-size: 9.5px; color: rgba(255,255,255,0.2); margin-top: 3px; }
    .msg-user .msg-time { text-align: right; }
    .msg-ora .msg-time { text-align: left; }

    .msg-typing { display: flex; gap: 4px; padding: 14px 18px; background: #1A2744; border-radius: 4px 18px 18px 18px; align-items: center; }
    .t-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.3); animation: tbounce 1.3s infinite; }
    .t-dot:nth-child(2) { animation-delay: 0.2s; }
    .t-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes tbounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }

    .ora-suggestions { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 16px 4px; }
    .s-chip { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); border-radius: 16px; padding: 5px 12px; font-size: 11px; cursor: pointer; transition: all 0.15s; font-family: inherit; }
    .s-chip:hover { background: rgba(0,230,118,0.06); border-color: rgba(0,230,118,0.15); color: #00E676; }

    /* ===== MOBILE (bottom sheet) ===== */
    .ora-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; z-index: 2000; }
    .ora-sheet { width: 100%; height: 85vh; background: #0A1428; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; animation: mSlideUp 0.3s ease; }
    @keyframes mSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

    .ora-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); flex-shrink: 0; }
    .ora-header-left { display: flex; align-items: center; gap: 10px; }
    .ora-body { flex: 1; overflow-y: auto; padding: 20px 14px 8px; display: flex; flex-direction: column; }
    .ora-footer { padding: 8px 12px 16px; flex-shrink: 0; }

    /* ===== DESKTOP (floating widget) ===== */
    .d-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: transparent; z-index: 2000; }
    .d-widget { position: fixed; bottom: 20px; right: 20px; width: 360px; height: 520px; background: #0A1428; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 8px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden; animation: dIn 0.2s ease; }
    @keyframes dIn { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

    .d-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); flex-shrink: 0; background: rgba(255,255,255,0.02); }
    .d-header-left { display: flex; align-items: center; gap: 10px; }
    .d-body { flex: 1; overflow-y: auto; padding: 20px 14px 4px; display: flex; flex-direction: column; }
    .d-footer { padding: 8px 12px 12px; flex-shrink: 0; }
    .d-footer-note { display: block; text-align: center; font-size: 9.5px; color: rgba(255,255,255,0.12); margin-top: 6px; letter-spacing: 0.5px; }

    /* Scrollbar styling */
    .ora-body::-webkit-scrollbar, .d-body::-webkit-scrollbar { width: 4px; }
    .ora-body::-webkit-scrollbar-track, .d-body::-webkit-scrollbar-track { background: transparent; }
    .ora-body::-webkit-scrollbar-thumb, .d-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
  `]
})
export class OraChatComponent implements OnInit {
  private _auth = inject(AuthService);
  private _wallet = inject(WalletService);
  device = inject(DeviceService);
  @Output() close = new EventEmitter<void>();

  inputText = '';
  messages = signal<{ role: 'user' | 'assistant'; content: string; time: string }[]>([
    { role: 'assistant', content: "Hey there! 👋 I'm Ora, your BetPool AI assistant. Ask me anything about betting, your wallet, or your account!", time: this.formatTime(new Date()) }
  ]);
  loading = signal(false);

  suggestions = ['What is my balance?', 'How do I place a bet?', 'How do deposits work?', 'What is KYC?'];

  ngOnInit() {
    this._wallet.fetchBalance();
  }

  sendMessage(textOverride?: string) {
    const text = (textOverride || this.inputText).trim();
    if (!text || this.loading()) return;

    const userMsg = { role: 'user' as const, content: text, time: this.formatTime(new Date()) };
    this.messages.update(m => [...m, userMsg]);
    this.inputText = '';
    this.loading.set(true);

    const apiMessages = this.messages().map(m => ({ role: m.role, content: m.content }));

    this._auth.chatWithOra(apiMessages).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          const oraMsg = { role: 'assistant' as const, content: res.data.content, time: this.formatTime(new Date()) };
          this.messages.update(m => [...m, oraMsg]);
        }
      },
      error: () => {
        this.loading.set(false);
        this.messages.update(m => [...m, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.', time: this.formatTime(new Date()) }]);
      }
    });

    setTimeout(() => {
      const container = document.querySelector('.ora-body, .d-body');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }

  quickQuestion(q: string) {
    this.sendMessage(q);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }
}
