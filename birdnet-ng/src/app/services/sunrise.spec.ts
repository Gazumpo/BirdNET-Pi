import { TestBed } from '@angular/core/testing';

import { Sunrise } from './sunrise';

describe('Sunrise', () => {
  let service: Sunrise;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sunrise);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
