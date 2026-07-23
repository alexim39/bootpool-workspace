import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BetCardComponent } from './bet-card.component';
import { Stake } from '../../../../core/services';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('BetCardComponent', () => {
  let fixture: ComponentFixture<BetCardComponent>;
  let component: BetCardComponent;

  function createStake(overrides: Partial<Stake> = {}): Stake {
    return {
      id: 'stake-1',
      podId: 'pod-1',
      stakeAmount: 1000,
      potentialPayout: 2500,
      netPayout: 1750,
      platformFee: 750,
      feePercent: 30,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      profit: 0,
      isActive: true,
      isSettled: false,
      pod: {
        id: 'pod-1',
        title: 'Test Match',
        sport: 'Football',
        league: 'Premier League',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        matchDate: new Date(Date.now() + 86400000).toISOString(),
        selection: 'Home Win',
        gainsMultiplier: 2.5,
        minStake: 100,
        maxStake: 50000,
        maxPayout: 250000,
        status: 'active',
        opensAt: new Date().toISOString(),
        stakingClosesAt: new Date(Date.now() + 3600000).toISOString(),
        isLive: false,
      },
      ...overrides,
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BetCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(BetCardComponent);
    component = fixture.componentInstance;
  });

  it('maps lost status to Refunded', () => {
    expect(component.formatStatus('lost')).toBe('Refunded');
  });

  it('maps cashed_out status to Cashed Out', () => {
    expect(component.formatStatus('cashed_out')).toBe('Cashed Out');
  });

  it('maps won status to Won', () => {
    expect(component.formatStatus('won')).toBe('Won');
  });

  it('maps confirmed status to Active', () => {
    expect(component.formatStatus('confirmed')).toBe('Active');
  });

  it('returns correct status classes', () => {
    expect(component.getStatusClass('won')).toBe('chip-emerald');
    expect(component.getStatusClass('lost')).toBe('chip-gray');
    expect(component.getStatusClass('cashed_out')).toBe('chip-blue');
    expect(component.getStatusClass('confirmed')).toBe('chip-gold');
    expect(component.getStatusClass('cancelled')).toBe('chip-gray');
  });

  it('returns correct status icons', () => {
    expect(component.getStatusIcon('won')).toBe('emoji_events');
    expect(component.getStatusIcon('lost')).toBe('autorenew');
    expect(component.getStatusIcon('cashed_out')).toBe('currency_exchange');
    expect(component.getStatusIcon('confirmed')).toBe('check_circle');
  });

  it('shows cashout button for unsettled stakes when showActions is true', () => {
    component.stake = createStake();
    component.showActions = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Request Cashout');
  });

  it('hides cashout button for settled stakes', () => {
    component.stake = createStake({ isSettled: true, status: 'won' });
    component.showActions = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Request Cashout');
  });

  it('hides cashout button when showActions is false', () => {
    component.stake = createStake();
    component.showActions = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Request Cashout');
  });

  it('shows Won and green profit for won settled stakes', () => {
    component.stake = createStake({ isSettled: true, status: 'won', profit: 1750 });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Won');
    expect(el.textContent).toContain('+₦1,750');
  });

  it('shows neutral profit for non-win settled stakes (lost)', () => {
    component.stake = createStake({ isSettled: true, status: 'lost', profit: 0 });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Refunded');
  });

  it('shows Cashed Out for cashed_out settled stakes', () => {
    component.stake = createStake({ isSettled: true, status: 'cashed_out', profit: 4500 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cashed Out');
  });

  it('emits cashoutRequested on cashout action', () => {
    spyOn(component.cashoutRequested, 'emit');
    component.onCashout('stake-1');
    expect(component.cashoutRequested.emit).toHaveBeenCalledWith('stake-1');
  });
});
