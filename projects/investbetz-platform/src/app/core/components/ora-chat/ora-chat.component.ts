import { Component, signal, inject, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services';
import { WalletService } from '../../services';
import { DeviceService } from '../../services';

@Component({
  selector: 'app-ora-chat',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, FormsModule],
  templateUrl: './ora-chat.component.html',
  styleUrls: ['./ora-chat.component.scss']
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
