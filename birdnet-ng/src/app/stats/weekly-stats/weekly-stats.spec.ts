import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyStats } from './weekly-stats';

describe('WeeklyStats', () => {
  let component: WeeklyStats;
  let fixture: ComponentFixture<WeeklyStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeeklyStats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
