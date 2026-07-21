import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositMgtComponent } from './deposit-mgt.component';

describe('DepositMgtComponent', () => {
  let component: DepositMgtComponent;
  let fixture: ComponentFixture<DepositMgtComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [DepositMgtComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositMgtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
