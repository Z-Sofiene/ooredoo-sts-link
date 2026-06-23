import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSouszoneComponent } from './add-souszone.component';

describe('AddSouszoneComponent', () => {
  let component: AddSouszoneComponent;
  let fixture: ComponentFixture<AddSouszoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddSouszoneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddSouszoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
