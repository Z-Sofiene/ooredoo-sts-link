import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCiteComponent } from './add-cite.component';

describe('AddCiteComponent', () => {
  let component: AddCiteComponent;
  let fixture: ComponentFixture<AddCiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddCiteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
