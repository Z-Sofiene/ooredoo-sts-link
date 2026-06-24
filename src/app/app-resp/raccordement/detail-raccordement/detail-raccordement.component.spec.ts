import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailRaccordementComponent } from './detail-raccordement.component';

describe('DetailRaccordementComponent', () => {
  let component: DetailRaccordementComponent;
  let fixture: ComponentFixture<DetailRaccordementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetailRaccordementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailRaccordementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
