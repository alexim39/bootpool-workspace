import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CashoutModalComponent } from './cashout-modal.component';
import { StakeService, Stake } from '../../core/services/stake.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

describe('CashoutModalComponent', () => {
  let fixture: ComponentFixture<CashoutModalComponent>;
  let component: CashoutModalComponent;
  let mockStakeService: jasmine.SpyObj<StakeService>;
  let mockStake: Stake;

  function createStake(overrides: Partial<Stake> = {}): Stake {
    return {
      id: 'stake-1',
      podId: 'pod-1',
      stakeAmount: 5000,
      potentialPayout: 12500,
      netPayout: 8750,
      platformFee: 3750,
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
    mockStakeService = jasmine.createSpyObj('StakeService', ['confirmCashout']);
    mockStake = createStake();

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, CashoutModalComponent],
      providers: [
        { provide: StakeService, useValue: mockStakeService },
      ],
    }).compileComponents();

    spyOn(MatSnackBar.prototype, 'open');

    fixture = TestBed.createComponent(CashoutModalComponent);
    component = fixture.componentInstance;
    component.stake = mockStake;
    fixture.detectChanges();
  });

  it('calculates cashout fee as 10% of stake', () => {
    expect(component.cashoutFee()).toBe(500);
    expect(component.cashoutPayout()).toBe(4500);
  });

  it('shows "This cannot be undone" warning', () => {
    expect(fixture.nativeElement.textContent).toContain('This cannot be undone');
  });

  it('displays fee breakdown in template', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Cashout fee');
    expect(text).toContain("You'll receive");
    expect(text).toContain('10%');
  });

  it('calls confirmCashout on confirm', fakeAsync(() => {
    mockStakeService.confirmCashout.and.returnValue(of({ success: true }).pipe(delay(0)));
    component.confirmCashout();
    tick();
    expect(mockStakeService.confirmCashout).toHaveBeenCalledWith('stake-1');
  }));

  it('emits cashoutConfirmed on success', fakeAsync(() => {
    mockStakeService.confirmCashout.and.returnValue(of({ success: true }).pipe(delay(0)));
    spyOn(component.cashoutConfirmed, 'emit');
    component.confirmCashout();
    tick();
    expect(component.cashoutConfirmed.emit).toHaveBeenCalled();
  }));

  it('emits close on success', fakeAsync(() => {
    mockStakeService.confirmCashout.and.returnValue(of({ success: true }).pipe(delay(0)));
    spyOn(component.close, 'emit');
    component.confirmCashout();
    tick();
    expect(component.close.emit).toHaveBeenCalled();
  }));

  it('shows success snackbar with payout amount', fakeAsync(() => {
    mockStakeService.confirmCashout.and.returnValue(of({ success: true }).pipe(delay(0)));
    component.confirmCashout();
    tick();
    expect(MatSnackBar.prototype.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/Cashed out/),
      'OK',
      jasmine.any(Object)
    );
  }));

  it('shows error snackbar on failure', fakeAsync(() => {
    mockStakeService.confirmCashout.and.returnValue(of({ success: false, message: 'Insufficient balance' }).pipe(delay(0)));
    component.confirmCashout();
    tick();
    expect(MatSnackBar.prototype.open).toHaveBeenCalledWith('Insufficient balance', 'OK', jasmine.any(Object));
  }));

  it('handles HTTP error gracefully', fakeAsync(() => {
    mockStakeService.confirmCashout.and.returnValue(
      throwError(() => ({ error: { message: 'Server error' } }))
    );
    component.confirmCashout();
    tick();
    expect(MatSnackBar.prototype.open).toHaveBeenCalledWith('Server error', 'OK', jasmine.any(Object));
  }));

  it('sets submitting signal during async operation', fakeAsync(() => {
    mockStakeService.confirmCashout.and.returnValue(of({ success: true }).pipe(delay(0)));
    component.confirmCashout();
    expect(component.submitting()).toBeTrue();
    tick();
    expect(component.submitting()).toBeFalse();
  }));

  it('formats currency in NGN', () => {
    expect(component.formatCurrency(5000)).toContain('₦');
    expect(component.formatCurrency(5000)).toContain('5,000');
  });
});
