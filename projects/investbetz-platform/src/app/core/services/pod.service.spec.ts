import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PodService, Pod, PodFeedResponse, PaginatedPodFeedResponse, PodGainsResponse } from './pod.service';
import { environment } from '../../../environments/environment';

describe('PodService', () => {
  let service: PodService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PodService],
    });
    service = TestBed.inject(PodService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetchFeed returns pod list and updates pods signal', () => {
    const mockResponse: PaginatedPodFeedResponse = {
      success: true,
      data: {
        items: [
          { id: '1', title: 'Pod 1', sport: 'Football' } as Pod,
          { id: '2', title: 'Pod 2', sport: 'Basketball' } as Pod,
        ],
        total: 2,
        hasMore: false,
      },
    };

    service.fetchFeed();
    const req = httpMock.expectOne(`${environment.apiUrl}/pods/feed?`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(service.pods().length).toBe(2);
    expect(service.pods()[0].title).toBe('Pod 1');
    expect(service.pods()[1].sport).toBe('Basketball');
  });

  it('fetchFeed passes query parameters', () => {
    service.fetchFeed({ sport: 'Football', isLive: true, limit: 5 });
    const req = httpMock.expectOne(`${environment.apiUrl}/pods/feed?sport=Football&isLive=true&limit=5`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { items: [], total: 0, hasMore: false } });
  });

  it('fetchFeed sets loading signal', () => {
    const mockResponse: PaginatedPodFeedResponse = { success: true, data: { items: [], total: 0, hasMore: false } };
    service.fetchFeed();
    expect(service.loading()).toBeTrue();

    const req = httpMock.expectOne(`${environment.apiUrl}/pods/feed?`);
    req.flush(mockResponse);
    expect(service.loading()).toBeFalse();
  });

  it('fetchFeed sets error on failure', () => {
    service.fetchFeed();
    const req = httpMock.expectOne(`${environment.apiUrl}/pods/feed?`);
    req.flush({ message: 'Network error' }, { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Network error');
    expect(service.loading()).toBeFalse();
  });

  it('getGains returns gains data', () => {
    const mockResponse: PodGainsResponse = {
      success: true,
      data: {
        gainsMultiplier: 2.5,
        minStake: 100,
        maxStake: 50000,
        maxPayout: 100000,
        projectedPayout: (stake: number) => stake * 2.5,
      },
    };

    service.getGains('pod-1').subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.gainsMultiplier).toBe(2.5);
      expect(res.data.minStake).toBe(100);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/pods/pod-1/gains`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('search returns filtered results', () => {
    const mockResponse: PodFeedResponse = {
      success: true,
      data: [
        { id: '3', title: 'Liverpool vs Arsenal', sport: 'Football' } as Pod,
      ],
    };

    service.search('Liverpool').subscribe(res => {
      expect(res.data.length).toBe(1);
      expect(res.data[0].title).toContain('Liverpool');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/pods/search?q=Liverpool&limit=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('search with custom limit', () => {
    service.search('Chelsea', 5).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/pods/search?q=Chelsea&limit=5`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('getById returns single pod', () => {
    const mockPod = { id: 'pod-1', title: 'My Pod' } as Pod;

    service.getById('pod-1').subscribe(res => {
      expect(res.data.title).toBe('My Pod');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/pods/pod-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockPod });
  });

  it('computes activePods correctly', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const pastDate = new Date(Date.now() - 86400000).toISOString();

    const pods = [
      { id: '1', status: 'active', stakingClosesAt: futureDate } as Pod,
      { id: '2', status: 'active', stakingClosesAt: pastDate } as Pod,
      { id: '3', status: 'settled', stakingClosesAt: futureDate } as Pod,
    ];

    service.pods.set(pods);
    expect(service.activePods().length).toBe(1);
    expect(service.activePods()[0].id).toBe('1');
  });
});
