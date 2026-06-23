import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperateurOoredooComponent } from './operateur-ooredoo.component';

describe('OperateurOoredooComponent', () => {
  let component: OperateurOoredooComponent;
  let fixture: ComponentFixture<OperateurOoredooComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OperateurOoredooComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperateurOoredooComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
