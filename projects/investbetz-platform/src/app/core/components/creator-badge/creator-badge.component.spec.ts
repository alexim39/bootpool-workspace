import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreatorBadgeComponent } from './creator-badge.component';
import { TipsterBadge } from '../../services/social-feed.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CreatorBadgeComponent', () => {
  let fixture: ComponentFixture<CreatorBadgeComponent>;
  let component: CreatorBadgeComponent;

  function badge(overrides: Partial<TipsterBadge> = {}): TipsterBadge {
    return {
      tier: 'Pro',
      settled: 150,
      won: 90,
      winRate: 60,
      roi: 8,
      computedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorBadgeComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CreatorBadgeComponent);
    component = fixture.componentInstance;
  });

  it('renders nothing without a badge', () => {
    fixture.componentRef.setInput('badge', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('renders nothing for Rookie (below sample floors — honesty by omission)', () => {
    fixture.componentRef.setInput('badge', badge({ tier: 'Rookie', settled: 5 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
    expect(fixture.nativeElement.querySelector('.creator-badge')).toBeFalsy();
  });

  it('renders the tier with proof tooltip for qualified creators', () => {
    fixture.componentRef.setInput('badge', badge());
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.creator-badge');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('Pro');
    expect(el.classList.contains('tier-pro')).toBe(true);
    expect(component.tooltip()).toContain('60%');
    expect(component.tooltip()).toContain('150 settled copies');
  });

  it('applies the legend style for Legend tier', () => {
    fixture.componentRef.setInput('badge', badge({ tier: 'Legend' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.creator-badge.tier-legend')).toBeTruthy();
  });
});
