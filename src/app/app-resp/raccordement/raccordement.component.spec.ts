import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaccordementComponent } from './raccordement.component';

describe('RaccordementComponent', () => {
  let component: RaccordementComponent;
  let fixture: ComponentFixture<RaccordementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RaccordementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaccordementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
