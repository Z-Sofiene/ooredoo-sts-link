import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppRhComponent } from './app-rh.component';

describe('AppRhComponent', () => {
  let component: AppRhComponent;
  let fixture: ComponentFixture<AppRhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppRhComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppRhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
