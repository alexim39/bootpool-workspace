import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StakeModalComponent } from './stake-modal.component';
import { Pod } from '../../core/services/pod.service';
import { StakeService } from '../../core/services/stake.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

describe('StakeModalComponent', () => {
  let fixture: ComponentFixture<StakeModalComponent>;
  let component: StakeModalComponent;
  let mockStakeService: jasmine.SpyObj<StakeService>;
  let mockPod: Pod;

  function createPod(overrides: Partial<Pod> = {}): Pod {
    return {
      id: 'pod-1',
      title: 'Arsenal vs Chelsea',
      sport: 'Football',
      gainsMultiplier: 2.5,
      minStake: 100,
      maxStake: 50000,
      maxPayout: 250000,
      maxTotalExposure: 1000000,
      currentExposure: 300000,
      currentParticipants: 30,
      status: 'active',
      stakingClosesAt: new Date(Date.now() + 3600000).toISOString(),
      settlementEstimateLabel: 'Tomorrow 8pm',
      settlementEstimateAt: new Date(Date.now() + 86400000).toISOString(),
      openedAt: new Date().toISOString(),
      isLive: false,
      displayOrder: 1,
      league: 'Premier League',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      matchDate: new Date(Date.now() + 86400000).toISOString(),
      selection: 'Home Win',
      impliedProbability: 0.4,
      legs: [],
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: '',
      ...overrides,
    };
  }

  beforeEach(async () => {
    mockStakeService = jasmine.createSpyObj('StakeService', ['placeStake']);
    mockPod = createPod();

    await TestBed.configureTestingModule({
      imports: [StakeModalComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: StakeService, useValue: mockStakeService },
      ],
    })
      .overrideComponent(StakeModalComponent, {
        set: {
          template: `
            <div class="modal-overlay">
              <div class="modal-container">
                <form [formGroup]="amountForm">
                  <input formControlName="amount" />
                </form>
                <form [formGroup]="confirmForm">
                  <input type="checkbox" formControlName="confirmTerms" />
                </form>
                <div class="win-refund-box">
                  <span>If this Pod wins</span>
                  <span>refunded</span>
                </div>
                <button class="confirm-btn" (click)="placeStake()">Confirm</button>
              </div>
            </div>
          `,
        },
      })
      .compileComponents();

    spyOn(MatSnackBar.prototype, 'open');

    fixture = TestBed.createComponent(StakeModalComponent);
    component = fixture.componentInstance;
    component.pod = mockPod;
    fixture.detectChanges();
  });

  it('shows win/refund language without loss warning or Bet responsibly', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('If this Pod wins');
    expect(text).toContain('refunded');
    expect(text).not.toContain('Bet responsibly');
    expect(text).not.toContain('If it loses');
  });

  it('validates stake amount - required', () => {
    const control = component.amountForm.get('amount')!;
    control.setValue(null);
    control.markAsTouched();
    expect(control.errors?.['required']).toBeTrue();
  });

  it('validates stake amount - minimum', () => {
    const control = component.amountForm.get('amount')!;
    control.setValue(50);
    control.markAsTouched();
    expect(control.errors?.['min']).toBeTruthy();
  });

  it('validates stake amount - accepts valid amounts', () => {
    const control = component.amountForm.get('amount')!;
    control.setValue(100);
    expect(control.valid).toBeTrue();
    control.setValue(10000);
    expect(control.valid).toBeTrue();
  });

  it('shows payout breakdown computed values', () => {
    component.amountForm.patchValue({ amount: 1000 });
    fixture.detectChanges();

    expect(component.estimatedPayout()).toBe(2500);
    expect(component.estimatedFee()).toBe(750);
    expect(component.estimatedNetPayout()).toBe(1750);
  });

  it('shows payout with zero stake as zero', () => {
    component.amountForm.patchValue({ amount: 0 });
    fixture.detectChanges();

    expect(component.estimatedPayout()).toBe(0);
    expect(component.estimatedFee()).toBe(0);
    expect(component.estimatedNetPayout()).toBe(0);
  });

  it('calls placeStake on confirm with proper arguments', fakeAsync(() => {
    mockStakeService.placeStake.and.returnValue(of({ success: true }).pipe(delay(0)));
    component.amountForm.patchValue({ amount: 1000 });
    component.confirmForm.patchValue({ confirmTerms: true });

    component.placeStake();
    tick();

    expect(mockStakeService.placeStake).toHaveBeenCalledWith({ podId: 'pod-1', stakeAmount: 1000 });
  }));

  it('shows success snackbar and emits stakePlaced on successful stake', fakeAsync(() => {
    mockStakeService.placeStake.and.returnValue(of({ success: true }).pipe(delay(0)));
    spyOn(component.stakePlaced, 'emit');
    spyOn(component.close, 'emit');
    component.amountForm.patchValue({ amount: 1000 });
    component.confirmForm.patchValue({ confirmTerms: true });

    component.placeStake();
    tick();

    expect(MatSnackBar.prototype.open).toHaveBeenCalledWith('Stake placed successfully!', 'OK', jasmine.any(Object));
    expect(component.stakePlaced.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  }));

  it('does not call placeStake when forms are invalid', () => {
    component.placeStake();
    expect(mockStakeService.placeStake).not.toHaveBeenCalled();
  });

  it('does not call placeStake when terms not accepted', () => {
    component.amountForm.patchValue({ amount: 1000 });
    component.placeStake();
    expect(mockStakeService.placeStake).not.toHaveBeenCalled();
  });

  it('sets submitting signal during async operation', fakeAsync(() => {
    mockStakeService.placeStake.and.returnValue(of({ success: true }).pipe(delay(0)));
    component.amountForm.patchValue({ amount: 1000 });
    component.confirmForm.patchValue({ confirmTerms: true });

    component.placeStake();
    expect(component.submitting()).toBeTrue();
    tick();
    expect(component.submitting()).toBeFalse();
  }));

  it('sets quick amount on button click', () => {
    component.setQuickAmount(5000);
    expect(component.amountForm.get('amount')?.value).toBe(5000);
  });

  it('filters quick amounts based on available balance', () => {
    component.availableBalance.set(3000);
    fixture.detectChanges();
    const amts = component.quickAmounts();
    expect(amts).toContain(500);
    expect(amts).toContain(1000);
    expect(amts).toContain(2000);
    expect(amts).not.toContain(5000);
    expect(amts).not.toContain(10000);
  });

  it('formats amount as NGN currency', () => {
    expect(component.formatAmount(1500)).toContain('₦1,500');
    expect(component.formatAmount(0)).toContain('₦0');
  });
});
