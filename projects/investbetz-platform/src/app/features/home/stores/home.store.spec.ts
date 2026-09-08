import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomeStore } from './home.store';

describe('HomeStore slipStakeAmount', () => {
  let store: HomeStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [provideRouter([])],
    });
    store = TestBed.inject(HomeStore);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts at zero with a 500 copy default', () => {
    expect(store.slipStakeAmount()).toBe(0);
    expect(store.defaultCopyStake).toBe(500);
  });

  it('accepts valid preset amounts', () => {
    store.setSlipStakeAmount(500);
    expect(store.slipStakeAmount()).toBe(500);
  });

  it('rejects NaN, infinite, and negative amounts to zero', () => {
    store.setSlipStakeAmount(NaN);
    expect(store.slipStakeAmount()).toBe(0);
    store.setSlipStakeAmount(Infinity);
    expect(store.slipStakeAmount()).toBe(0);
    store.setSlipStakeAmount(-50);
    expect(store.slipStakeAmount()).toBe(0);
  });

  it('resets the amount when selections are cleared', () => {
    store.setSlipStakeAmount(500);
    store.clearSelections();
    expect(store.slipStakeAmount()).toBe(0);
  });
});
