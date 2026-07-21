import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WagersUpdateComponent } from './wagers-update.component';

describe('WagersUpdateComponent', () => {
  let component: WagersUpdateComponent;
  let fixture: ComponentFixture<WagersUpdateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [WagersUpdateComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WagersUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
