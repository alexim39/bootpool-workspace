import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StakeService, PlaceStakeRequest, CalculatePayoutResponse } from './stake.service';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';
import { environment } from '../../../environments/environment';

describe('StakeService', () => {
  let service: StakeService;
  let httpMock: HttpTestingController;
  let mockAuthService: { token: () => string | null };

  beforeEach(() => {
    const mockToken = signal('test-jwt-token');
    mockAuthService = {
      token: mockToken.asReadonly(),
    } as unknown as AuthService;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        StakeService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    service = TestBed.inject(StakeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('placeStake posts to /stakes with authorization header', () => {
    const request: PlaceStakeRequest = { podId: 'pod-1', stakeAmount: 1000 };

    service.placeStake(request).subscribe(res => {
      expect(res.success).toBeTrue();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/stakes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    req.flush({ success: true });
  });

  it('getCashoutQuote fetches cashout quote', () => {
    const mockResponse = {
      success: true,
      data: { stakeAmount: 5000, feeAmount: 500, payoutAmount: 4500 },
    };

    service.getCashoutQuote('stake-1').subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.payoutAmount).toBe(4500);
      expect(res.data.feeAmount).toBe(500);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/stakes/stake-1/cashout/quote`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    req.flush(mockResponse);
  });

  it('confirmCashout posts to cashout confirm endpoint', () => {
    const mockResponse = { success: true, data: { cashoutAmount: 4500, cashoutFee: 500 } };

    service.confirmCashout('stake-1').subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data?.cashoutAmount).toBe(4500);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/stakes/stake-1/cashout/confirm`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    req.flush(mockResponse);
  });

  it('calculatePayout returns payout breakdown', () => {
    const mockResponse: CalculatePayoutResponse = {
      success: true,
      data: {
        potentialPayout: 2500,
        platformFee: 750,
        netPayout: 1750,
        minStake: 100,
        maxStake: 50000,
      },
    };

    service.calculatePayout('pod-1', 1000).subscribe(res => {
      expect(res.data?.netPayout).toBe(1750);
      expect(res.data?.platformFee).toBe(750);
      expect(res.data?.potentialPayout).toBe(2500);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/stakes/calculate?podId=pod-1&stakeAmount=1000`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    req.flush(mockResponse);
  });

  it('getStakeById fetches a single stake', () => {
    service.getStakeById('stake-1').subscribe(res => {
      expect(res.data.id).toBe('stake-1');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/stakes/stake-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { id: 'stake-1', stakeAmount: 1000 } });
  });

  it('fetchMyStakes returns paginated stakes', () => {
    service.fetchMyStakes(1, 10).subscribe(res => {
      expect(res.data.total).toBe(1);
      expect(res.data.stakes.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/stakes?page=1&limit=10`);
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: { stakes: [{ id: 'stake-1', stakeAmount: 1000 }], total: 1 },
    });
  });

  it('fetchMyStakes with status filter', () => {
    service.fetchMyStakes(1, 20, 'won').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/stakes?page=1&limit=20&status=won`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { stakes: [], total: 0 } });
  });

  it('getStatusColor returns correct colors', () => {
    expect(service.getStatusColor('won')).toBe('success');
    expect(service.getStatusColor('lost')).toBe('default');
    expect(service.getStatusColor('cashed_out')).toBe('primary');
    expect(service.getStatusColor('void')).toBe('warning');
    expect(service.getStatusColor('confirmed')).toBe('primary');
  });

  it('formatStatus maps statuses correctly', () => {
    expect(service.formatStatus('lost')).toBe('Refunded');
    expect(service.formatStatus('refunded')).toBe('Refunded');
    expect(service.formatStatus('cashed_out')).toBe('Cashed Out');
    expect(service.formatStatus('won')).toBe('Won');
    expect(service.formatStatus('confirmed')).toBe('Confirmed');
  });
});
