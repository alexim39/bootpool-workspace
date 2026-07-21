import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawMgtComponent } from './withdraw-mgt.component';

describe('WithdrawMgtComponent', () => {
  let component: WithdrawMgtComponent;
  let fixture: ComponentFixture<WithdrawMgtComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [WithdrawMgtComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawMgtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
