import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectionDetail } from './detection-detail';

describe('DetectionDetail', () => {
  let component: DetectionDetail;
  let fixture: ComponentFixture<DetectionDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetectionDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetectionDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
