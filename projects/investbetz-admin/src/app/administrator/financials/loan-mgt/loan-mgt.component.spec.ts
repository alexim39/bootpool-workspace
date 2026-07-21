import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoanMgtComponent } from './loan-mgt.component';

describe('LoanMgtComponent', () => {
  let component: LoanMgtComponent;
  let fixture: ComponentFixture<LoanMgtComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [LoanMgtComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoanMgtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
