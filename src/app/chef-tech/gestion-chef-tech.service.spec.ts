import { TestBed } from '@angular/core/testing';

import { GestionChefTechService } from './gestion-chef-tech.service';

describe('GestionChefTechService', () => {
  let service: GestionChefTechService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionChefTechService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
