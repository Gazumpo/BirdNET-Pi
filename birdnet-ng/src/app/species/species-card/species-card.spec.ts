import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeciesCard } from './species-card';

describe('SpeciesCard', () => {
  let component: SpeciesCard;
  let fixture: ComponentFixture<SpeciesCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeciesCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeciesCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
