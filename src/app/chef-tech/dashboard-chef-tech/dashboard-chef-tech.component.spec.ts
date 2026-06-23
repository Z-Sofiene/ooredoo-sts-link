import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardChefTechComponent } from './dashboard-chef-tech.component';

describe('DashboardChefTechComponent', () => {
  let component: DashboardChefTechComponent;
  let fixture: ComponentFixture<DashboardChefTechComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardChefTechComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardChefTechComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
