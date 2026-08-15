import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PodCardComponent } from './pod-card.component';
import { Pod } from '../../../../core/services';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('PodCardComponent', () => {
  let fixture: ComponentFixture<PodCardComponent>;
  let component: PodCardComponent;
  let mockPod: Pod;

  function createPod(overrides: Partial<Pod> = {}): Pod {
    return {
      id: 'pod-1',
      title: 'Manchester United vs Liverpool',
      description: 'Premier League clash',
      sport: 'Football',
      league: 'Premier League',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      matchDate: new Date(Date.now() + 86400000).toISOString(),
      selection: 'Home Win',
      gainsMultiplier: 2.5,
      impliedProbability: 0.4,
      minStake: 100,
      maxStake: 50000,
      maxPayout: 250000,
      maxTotalExposure: 1000000,
      currentExposure: 400000,
      currentParticipants: 45,
      status: 'active',
      stakingClosesAt: new Date(Date.now() + 7200000).toISOString(),
      settlementEstimateLabel: 'Today 6:00 PM',
      settlementEstimateAt: new Date(Date.now() + 86400000).toISOString(),
      openedAt: new Date().toISOString(),
      isLive: false,
      displayOrder: 1,
      legs: [],
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  beforeEach(async () => {
    mockPod = createPod();
    await TestBed.configureTestingModule({
      imports: [PodCardComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(PodCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('pod', mockPod);
    fixture.detectChanges();
  });

  it('displays pod title and sport', () => {
    const el = fixture.nativeElement.textContent;
    expect(el).toContain('Manchester United vs Liverpool');
    expect(el).toContain('Football');
  });

  it('displays gains multiplier formatted to 2 decimal places', () => {
    expect(fixture.nativeElement.textContent).toContain('2.50');
  });

  it('displays min and max stake amounts', () => {
    const el = fixture.nativeElement.textContent;
    expect(el).toContain('Min₦100');
    expect(el).toContain('Max₦50,000');
  });

  it('shows staking close label', () => {
    expect(fixture.nativeElement.textContent).toContain('Staking Closes');
  });

  it('shows info tooltip with gains only', () => {
    expect(component.gainsTooltip()).toBe('Gains: 2.5x');
  });

  it('disables button when staking is closed (time remaining <= 0)', () => {
    const closedPod = createPod({ stakingClosesAt: new Date(Date.now() - 1000).toISOString() });
    const testFixture = TestBed.createComponent(PodCardComponent);
    testFixture.componentRef.setInput('pod', closedPod);
    testFixture.detectChanges();
    expect(testFixture.componentInstance.isOfferClosed()).toBeTrue();
    testFixture.destroy();
  });

  it('disables button when pod status is not active', () => {
    const settledPod = createPod({ status: 'settled' });
    const testFixture = TestBed.createComponent(PodCardComponent);
    testFixture.componentRef.setInput('pod', settledPod);
    testFixture.detectChanges();
    expect(testFixture.componentInstance.isOfferClosed()).toBeTrue();
    testFixture.destroy();
  });

  it('enables button when active and staking is open', () => {
    expect(component.isOfferClosed()).toBeFalse();
  });

  it('emits placeStake event with pod data on click', () => {
    spyOn(component.placeStake, 'emit');
    component.onPlaceStake();
    expect(component.placeStake.emit).toHaveBeenCalledWith(mockPod);
  });

  it('formats countdown correctly', () => {
    expect(component.formatCountdown(0)).toBe('Closed');
    expect(component.formatCountdown(-1)).toBe('Closed');
    expect(component.formatCountdown(125000)).toBe('02m : 05s');
    expect(component.formatCountdown(45000)).toBe('45s');
    expect(component.formatCountdown(60000)).toBe('01m : 00s');
    expect(component.formatCountdown(3600000)).toBe('01h : 00m : 00s');
  });

  it('calculates exposure percentage', () => {
    expect(component.exposurePercent()).toBe(40);
  });

  it('returns 0 exposure when no max exposure set', () => {
    const noExpPod = createPod({ maxTotalExposure: 0, currentExposure: 100 });
    const testFixture = TestBed.createComponent(PodCardComponent);
    testFixture.componentRef.setInput('pod', noExpPod);
    testFixture.detectChanges();
    expect(testFixture.componentInstance.exposurePercent()).toBe(0);
    testFixture.destroy();
  });

  it('shows the personalized recommendation reason when present', () => {
    const recPod = createPod({ whyRecommended: 'You often back Manchester United.' });
    const testFixture = TestBed.createComponent(PodCardComponent);
    testFixture.componentRef.setInput('pod', recPod);
    testFixture.detectChanges();
    expect(testFixture.componentInstance.recommended()).toBeTrue();
    expect(testFixture.nativeElement.textContent).toContain('You often back Manchester United.');
    testFixture.destroy();
  });

  it('hides the recommendation row when no reason is present', () => {
    expect(component.recommended()).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain('Recommended');
  });

  it('prefers the personalized reason over Ora reasoning for the Why? tooltip', () => {
    const recPod = createPod({
      whyRecommended: 'You regularly bet on Premier League.',
      metadata: { oraReasoning: 'Ora analysis says high confidence.' },
    });
    const testFixture = TestBed.createComponent(PodCardComponent);
    testFixture.componentRef.setInput('pod', recPod);
    testFixture.detectChanges();
    expect(testFixture.componentInstance.whyText()).toBe('You regularly bet on Premier League.');
    testFixture.destroy();
  });

  it('falls back to Ora reasoning when no personalized reason exists', () => {
    const oraPod = createPod({ metadata: { oraReasoning: 'Ora analysis says high confidence.' } });
    const testFixture = TestBed.createComponent(PodCardComponent);
    testFixture.componentRef.setInput('pod', oraPod);
    testFixture.detectChanges();
    expect(testFixture.componentInstance.whyText()).toBe('Ora analysis says high confidence.');
    testFixture.destroy();
  });
});
