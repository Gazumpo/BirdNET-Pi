import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllStats } from './all-stats';

describe('AllStats', () => {
  let component: AllStats;
  let fixture: ComponentFixture<AllStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllStats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
