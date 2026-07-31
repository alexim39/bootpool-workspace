import { Component, signal, inject, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { AuthService, ChatAction } from '../../services';
import { WalletService } from '../../services';
import { DeviceService } from '../../services';
import { StakeService } from '../../services';

type ActionState = 'pending' | 'confirming' | 'executing' | 'done' | 'cancelled';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  displayContent?: string;
  time: string;
  actions?: ChatAction[];
  actionStates?: ActionState[];
}

const ACTION_TAG_REGEX = /\s*\[(?:PENDING|STAKE|ACCUM)\]\{[\s\S]*?\}\[\/(?:PENDING|STAKE|ACCUM)\]\s*/g;

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
          const actions = res.data.actions || [];
          const oraMsg: ChatMessage = {
            role: 'assistant',
            content: res.data.content,
            displayContent: res.data.content.replace(ACTION_TAG_REGEX, ' ').trim(),
            time: this.formatTime(new Date()),
            actions: actions.length ? actions : undefined,
            actionStates: actions.length ? actions.map(() => 'pending' as ActionState) : undefined
          };
          this.messages.update(m => [...m, oraMsg]);
        }
      },
      error: (err) => {
        this.loading.set(false);
        const bizMsg = err?.error?.message;
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: bizMsg || "Ora's service is temporarily unreachable, so I couldn't take your bet. No worries — you can still place it manually from the Home feed: pick a pod and tap \"Place Stake\".",
          time: this.formatTime(new Date())
        }]);
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

  confirmStake(msgIndex: number, actionIndex: number) {
    const msg = this.messages()[msgIndex];
    const action = msg.actions?.[actionIndex];
    if (!action || msg.actionStates?.[actionIndex] !== 'pending') return;

    this.setActionState(msgIndex, actionIndex, 'executing');

    const request = action.type === 'confirm_accumulator'
      ? this._stake.placeAccumulator({ podIds: action.data.legs.map(l => l.podId), stakeAmount: action.data.stakeAmount })
      : this._stake.placeStake({ podId: action.data.podId, stakeAmount: action.data.amount });

    request.subscribe({
      next: (res) => {
        this.setActionState(msgIndex, actionIndex, 'done');
        const summary = action.type === 'confirm_accumulator'
          ? `You staked ₦${action.data.stakeAmount.toLocaleString()} on a ${action.data.legs.length}-leg accumulator (${action.data.legs.map(l => l.podTitle).join(', ')}).`
          : `You staked ₦${action.data.amount.toLocaleString()} on "${action.data.podTitle}".`;
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: `✅ Bet placed! ${summary} Check the Bets page for details.`,
          time: this.formatTime(new Date())
        }]);
        this._wallet.fetchBalance();
      },
      error: (err) => {
        this.setActionState(msgIndex, actionIndex, 'pending');
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: err?.error?.message || 'Sorry, I couldn\'t place that bet. Make sure you have enough balance and try again.',
          time: this.formatTime(new Date())
        }]);
      }
    });
  }

  cancelStake(msgIndex: number, actionIndex: number) {
    this.setActionState(msgIndex, actionIndex, 'cancelled');
    this.messages.update(m => [...m, {
      role: 'assistant',
      content: 'No problem! Let me know if you want to try a different bet.',
      time: this.formatTime(new Date())
    }]);
  }

  private setActionState(msgIndex: number, actionIndex: number, state: ActionState) {
    this.messages.update(m => {
      const updated = [...m];
      const msg = updated[msgIndex];
      if (msg?.actionStates) {
        const states = [...msg.actionStates];
        states[actionIndex] = state;
        updated[msgIndex] = { ...msg, actionStates: states };
      }
      return updated;
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }
}
