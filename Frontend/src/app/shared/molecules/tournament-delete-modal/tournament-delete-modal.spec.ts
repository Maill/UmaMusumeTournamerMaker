import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TournamentDeleteModal } from './tournament-delete-modal';

describe('TournamentDeleteModal', () => {
  let component: TournamentDeleteModal;
  let fixture: ComponentFixture<TournamentDeleteModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentDeleteModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TournamentDeleteModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
