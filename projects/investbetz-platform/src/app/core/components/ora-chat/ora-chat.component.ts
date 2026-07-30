import { Component, signal, inject, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { AuthService, StakeAction } from '../../services';
import { WalletService } from '../../services';
import { DeviceService } from '../../services';
import { StakeService } from '../../services';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  time: string;
  action?: StakeAction;
  actionState?: 'pending' | 'confirming' | 'executing' | 'done' | 'cancelled';
}

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
  private _stake = inject(StakeService);
  device = inject(DeviceService);
  @Output() close = new EventEmitter<void>();

  inputText = '';
  messages = signal<ChatMessage[]>([
    { role: 'assistant', content: "Hey there! 👋 I'm Ora, your BetPool AI assistant. Ask me anything about betting, your wallet, or your account!", time: this.formatTime(new Date()) }
  ]);
  loading = signal(false);

  suggestions = ['Place a bet', 'What is my balance?', 'How do I place a bet?', 'What is KYC?'];

  ngOnInit() {
    this._wallet.fetchBalance();
  }

  sendMessage(textOverride?: string) {
    const text = (textOverride || this.inputText).trim();
    if (!text || this.loading()) return;

    const userMsg: ChatMessage = { role: 'user', content: text, time: this.formatTime(new Date()) };
    this.messages.update(m => [...m, userMsg]);
    this.inputText = '';
    this.loading.set(true);

    const apiMessages = this.messages().map(m => ({ role: m.role, content: m.content }));

    this._auth.chatWithOra(apiMessages).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          const oraMsg: ChatMessage = {
            role: 'assistant',
            content: res.data.content,
            time: this.formatTime(new Date()),
            action: res.data.action || undefined,
            actionState: res.data.action ? 'pending' : undefined
          };
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

  confirmStake(msgIndex: number) {
    const msg = this.messages()[msgIndex];
    if (!msg.action || msg.actionState !== 'pending') return;

    this.messages.update(m => {
      const updated = [...m];
      updated[msgIndex] = { ...updated[msgIndex], actionState: 'executing' };
      return updated;
    });

    this._stake.placeStake({ podId: msg.action!.data.podId, stakeAmount: msg.action!.data.amount }).subscribe({
      next: (res) => {
        this.messages.update(m => {
          const updated = [...m];
          updated[msgIndex] = { ...updated[msgIndex], actionState: 'done' };
          return updated;
        });
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: `✅ Bet placed! You staked ₦${msg.action!.data.amount.toLocaleString()} on "${msg.action!.data.podTitle}". Check the Bets page for details.`,
          time: this.formatTime(new Date())
        }]);
        this._wallet.fetchBalance();
      },
      error: () => {
        this.messages.update(m => {
          const updated = [...m];
          updated[msgIndex] = { ...updated[msgIndex], actionState: 'pending' };
          return updated;
        });
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: 'Sorry, I couldn\'t place that bet. Make sure you have enough balance and try again.',
          time: this.formatTime(new Date())
        }]);
      }
    });
  }

  cancelStake(msgIndex: number) {
    this.messages.update(m => {
      const updated = [...m];
      updated[msgIndex] = { ...updated[msgIndex], actionState: 'cancelled' };
      return updated;
    });
    this.messages.update(m => [...m, {
      role: 'assistant',
      content: 'No problem! Let me know if you want to try a different bet.',
      time: this.formatTime(new Date())
    }]);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }
}
