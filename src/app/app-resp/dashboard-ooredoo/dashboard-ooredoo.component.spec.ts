import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardOoredooComponent } from './dashboard-ooredoo.component';

describe('DashboardOoredooComponent', () => {
  let component: DashboardOoredooComponent;
  let fixture: ComponentFixture<DashboardOoredooComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardOoredooComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardOoredooComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
