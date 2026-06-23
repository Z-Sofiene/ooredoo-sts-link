import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppRespComponent } from './app-resp.component';

describe('AppRespComponent', () => {
  let component: AppRespComponent;
  let fixture: ComponentFixture<AppRespComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppRespComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppRespComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
