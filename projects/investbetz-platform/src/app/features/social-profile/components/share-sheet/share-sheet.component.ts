import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';

export interface ShareTarget {
  id: string;
  name: string;
  username?: string | null;
  isOra?: boolean;
  badge?: string | null;
  tipsterBadge?: { tier: string; winRate: number; settled: number } | null;
}

@Component({
  selector: 'app-share-sheet',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './share-sheet.component.html',
  styleUrls: ['./share-sheet.component.scss']
})
export class ShareSheetComponent {
  profile = input.required<ShareTarget>();
  open = input(false);
  closed = output<void>();

  private snackBar = inject(MatSnackBar);
  private auth = inject(AuthService);

  shareUrl = computed(() => {
    const p = this.profile();
    const base = window.location.origin + '/social/' + p.id;
    const via = this.auth.user()?.id;
    const params = new URLSearchParams();
    params.set('src', 'share');
    params.set('ref', 'profile');
    if (via) params.set('via', via);
    return base + '?' + params.toString();
  });

  shareText = computed(() => {
    const p = this.profile();
    const badge = p.tipsterBadge && p.tipsterBadge.tier !== 'Rookie'
      ? ` — ${p.tipsterBadge.tier} tipster, ${p.tipsterBadge.winRate}% win rate over ${p.tipsterBadge.settled} settled copies`
      : p.badge && p.badge !== 'Rookie'
        ? ` — ${p.badge} creator`
        : '';
    const handle = p.username ? ` (@${p.username})` : '';
    return `Check out ${p.name}${handle} on BetPool${badge}. Copy their slips in one tap.`;
  });

  shareTitle = computed(() => `${this.profile().name} on BetPool`);

  close() {
    this.closed.emit();
  }

  private openUrl(url: string) {
    window.open(url, '_blank', 'noopener');
    this.close();
  }

  async copyLink(platformHint?: string) {
    const url = this.shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      const msg = platformHint
        ? `Link copied for ${platformHint} — paste to share`
        : 'Profile link copied to clipboard';
      this.snackBar.open(msg, 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Could not copy link', 'OK', { duration: 3000 });
    }
    if (platformHint) this.close();
  }

  nativeShare() {
    const url = this.shareUrl();
    const text = this.shareText();
    const title = this.shareTitle();
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {}).finally(() => this.close());
    } else {
      this.copyLink();
    }
  }

  shareWhatsApp() {
    const url = encodeURIComponent(this.shareUrl());
    const text = encodeURIComponent(this.shareText() + ' ' + this.shareUrl());
    // wa.me works on both mobile and desktop
    this.openUrl(`https://wa.me/?text=${text}`);
  }

  shareTelegram() {
    const url = encodeURIComponent(this.shareUrl());
    const text = encodeURIComponent(this.shareText());
    this.openUrl(`https://t.me/share/url?url=${url}&text=${text}`);
  }

  shareTwitter() {
    const url = encodeURIComponent(this.shareUrl());
    const text = encodeURIComponent(this.shareText());
    this.openUrl(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
  }

  shareFacebook() {
    const url = encodeURIComponent(this.shareUrl());
    this.openUrl(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  }

  shareInstagram() {
    // Instagram has no web intent for feed posts — copy + deep link to app
    this.copyLink('Instagram');
  }

  shareTikTok() {
    this.copyLink('TikTok');
  }
}
