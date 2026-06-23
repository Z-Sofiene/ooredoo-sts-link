import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddClientsOoredooComponent } from './add-clients-ooredoo.component';

describe('AddClientsOoredooComponent', () => {
  let component: AddClientsOoredooComponent;
  let fixture: ComponentFixture<AddClientsOoredooComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddClientsOoredooComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddClientsOoredooComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
