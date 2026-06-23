import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRaccordementComponent } from './add-raccordement.component';

describe('AddRaccordementComponent', () => {
  let component: AddRaccordementComponent;
  let fixture: ComponentFixture<AddRaccordementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddRaccordementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRaccordementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
