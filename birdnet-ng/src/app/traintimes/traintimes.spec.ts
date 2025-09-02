import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Traintimes } from './traintimes';

describe('Traintimes', () => {
  let component: Traintimes;
  let fixture: ComponentFixture<Traintimes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Traintimes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Traintimes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
