import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WagersUploadComponent } from './wagers-upload.component';

describe('WagersUploadComponent', () => {
  let component: WagersUploadComponent;
  let fixture: ComponentFixture<WagersUploadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [WagersUploadComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WagersUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
