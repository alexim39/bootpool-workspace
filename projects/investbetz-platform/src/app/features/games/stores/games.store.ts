import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { GamesService, TodayGame } from '../../../core/services';

export interface GamesFilters {
  search: string;
  league: string | null;
  marketType: string | null;
  stakableOnly: boolean;
  minConfidence: number | null;
  dateFrom: string | null;
  dateTo: string | null;
}

@Injectable({ providedIn: 'root' })
export class GamesStore implements OnDestroy {
  readonly service = inject(GamesService);

  readonly games = computed(() => this.service.games());
  readonly loading = computed(() => this.service.loading());
  readonly error = computed(() => this.service.error());
  readonly total = computed(() => this.service.total());
  readonly stakableTotal = computed(() => this.service.stakableTotal());
  readonly totalPages = computed(() => this.service.totalPages());
  readonly currentPage = computed(() => this.service.currentPage());
  readonly leagues = computed(() => this.service.leagues());

  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly sortField = signal('matchDate');
  readonly sortOrder = signal<'asc' | 'desc'>('asc');
  readonly searchText = signal('');
  readonly league = signal<string | null>(null);
  readonly marketType = signal<string | null>(null);
  readonly stakableOnly = signal(false);
  readonly minConfidence = signal<number | null>(null);
  readonly dateFrom = signal<string | null>(null);
  readonly dateTo = signal<string | null>(null);

  private readonly search$ = new Subject<string>();

  readonly marketTypes = computed(() => {
    const set = new Set<string>();
    for (const g of this.games()) {
      if (g.marketType) set.add(g.marketType);
    }
    return Array.from(set).sort();
  });

  readonly hasActiveFilters = computed(() =>
    this.searchText() !== '' ||
    this.league() !== null ||
    this.marketType() !== null ||
    this.stakableOnly() ||
    this.minConfidence() !== null ||
    this.dateFrom() !== null ||
    this.dateTo() !== null
  );

  readonly showSkeletons = computed(() => this.loading() && this.games().length === 0);

  readonly rangeLabel = computed(() => {
    const total = this.total();
    if (total === 0) return '0 games';
    const start = (this.page() - 1) * this.pageSize() + 1;
    const end = Math.min(this.page() * this.pageSize(), total);
    return `${start}–${end} of ${total}`;
  });

  constructor() {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.load());
  }

  init() {
    this.load();
  }

  refresh() {
    this.load();
  }

  setSearch(text: string) {
    this.searchText.set(text);
    this.search$.next(text);
  }

  setLeague(league: string | null) {
    this.league.set(league === 'All' ? null : league);
    this.page.set(1);
    this.load();
  }

  setMarketType(type: string | null) {
    this.marketType.set(type === 'All' ? null : type);
    this.page.set(1);
    this.load();
  }

  setStakableOnly(on: boolean) {
    this.stakableOnly.set(on);
    this.page.set(1);
    this.load();
  }

  setMinConfidence(value: number | null) {
    this.minConfidence.set(value);
    this.page.set(1);
    this.load();
  }

  setDateRange(from: string | null, to: string | null) {
    this.dateFrom.set(from);
    this.dateTo.set(to);
    this.page.set(1);
    this.load();
  }

  setSort(field: string) {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('desc');
    }
    this.page.set(1);
    this.load();
  }

  setPageSize(size: number) {
    this.pageSize.set(size);
    this.page.set(1);
    this.load();
  }

  setPage(p: number) {
    const clamped = Math.min(Math.max(1, p), Math.max(1, this.totalPages()));
    if (clamped === this.page()) return;
    this.page.set(clamped);
    this.load();
  }

  nextPage() {
    this.setPage(this.page() + 1);
  }

  prevPage() {
    this.setPage(this.page() - 1);
  }

  clearFilters() {
    this.searchText.set('');
    this.league.set(null);
    this.marketType.set(null);
    this.stakableOnly.set(false);
    this.minConfidence.set(null);
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.page.set(1);
    this.load();
  }

  private load() {
    const q: {
      page: number;
      limit: number;
      sortField: string;
      sortOrder: 'asc' | 'desc';
      search?: string;
      league?: string;
      marketType?: string;
      stakableOnly?: boolean;
      minConfidence?: number;
      dateFrom?: string | null;
      dateTo?: string | null;
    } = {
      page: this.page(),
      limit: this.pageSize(),
      sortField: this.sortField(),
      sortOrder: this.sortOrder(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
    };
    const search = this.searchText().trim();
    if (search) q.search = search;
    if (this.league()) q.league = this.league()!;
    if (this.marketType()) q.marketType = this.marketType()!;
    if (this.stakableOnly()) q.stakableOnly = true;
    if (this.minConfidence()) q.minConfidence = this.minConfidence()!;
    this.service.fetchGames(q);
  }

  selectLeague(league: string) {
    this.setLeague(league);
  }

  // Alias used by legacy consumers / specs
  readonly filteredGames = this.games;
  readonly analyzedCount = this.total;
  readonly stakableGames = computed(() => this.games().filter(g => g.stakable));
  readonly selectedLeague = computed(() => this.league());

  ngOnDestroy() {
    this.search$.complete();
  }
}

export type { TodayGame };