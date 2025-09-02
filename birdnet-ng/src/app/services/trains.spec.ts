import { TestBed } from '@angular/core/testing';

import { Trains } from './trains';

describe('Trains', () => {
  let service: Trains;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Trains);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
